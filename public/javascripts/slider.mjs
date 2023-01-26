import * as d3 from "https://cdn.skypack.dev/d3@7";
export function slider(histograms, min, max, layout, colors, starting_min = min, starting_max = max) {
    let range = [max, min]
    let starting_range = [starting_max, starting_min]

    // set width and height of svg
    let w = layout.width
    let h = layout.height
    let margin = layout.margin

    // dimensions of slider bar
    let width = w - margin.left - margin.right;
    let height = h - margin.top - margin.bottom;

    // create x scale
    let y = d3.scaleLinear()
        .domain(range)  // data space
        .range([0, height]);  // display space

    let x = d3.scaleLinear()
        .domain([0, 9000])  // data space
        .range([0, width]);  // display space

    // create svg and translated g
    let svg = d3.create("svg")
        .attr("width", w)
        .attr("height", h)
    let g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)
        .attr("font-size", "10");

    let line = d3.line()
        .curve(d3.curveBasis)
        .x(d => x(Math.min(10000, d[1])))
        .y(d => y(d[0]));

    for (let i = 0; i < 11; i++) {
        g.append("path")
            .datum(histograms.map(hist => {
                return [hist[0], hist[1][i]];
            }))
            .attr("fill", "none")
            .attr("stroke", colors[i])
            .attr("stroke-width", 1)
            .attr("stroke-linejoin", "round")
            .attr("d", line);
    }

    // labels
    let labelL = g.append('text')
        //.attr('id', 'labelleft')
        .attr('x', -38)
        .attr('y', -20)
        .attr('dy', "0.32em")
        .attr("fill", "currentColor")

    let labelR = g.append('text')
        //.attr('id', 'labelright')
        .attr('x', -38)
        .attr('y', 20)
        .attr('dy', "0.32em")
        .attr("fill", "currentColor")

    // define brush
    let brush = d3.brushY()
        .extent([[0, 0], [width, height]])
        .on('brush', function (event) {
            var s = event.selection;
            //console.log("brush event!");
            //console.log(s);
            // update and move labels
            labelL.attr('y', s[0] - 5)
                .text((y.invert(s[0]).toFixed(2)) + " AU")
            labelR.attr('y', s[1] + 5)
                .text((y.invert(s[1]).toFixed(2)) + " AU")
            // update view
            // if the view should only be updated after brushing is over,
            // move these two lines into the on('end') part below
            svg.node().value = s.map(function (d) {
                var temp = y.invert(d);
                return +temp.toFixed(2)
            });
        })
        .on("end", e => {
            let eventHandler = d3.select('.eventhandler');
            eventHandler.dispatch("a-change");
        })

    // append brush to g
    let gBrush = g.append("g")
        .attr("class", "brush")
        .call(brush)

    // override default behaviour - clicking outside of the selected area
    // will select a small piece there rather than deselecting everything
    // https://bl.ocks.org/mbostock/6498000
    gBrush.selectAll(".overlay")
        .each(function (d) {
            d.type = "selection";
        })
        .on("mousedown touchstart", e => brushcentered(gBrush, e))

    function brushcentered(parent, e) {
        //console.log(e);
        //console.log(parent);
        var dy = y(0.3) - y(0.4), // Use a fixed width when recentering.
            cy = e.offsetY - 40,
            y0 = cy - dy / 2,
            y1 = cy + dy / 2;

        //console.log("dy: " + dy + ", cy: " + cy + ", y0: " + y0 + ", y1: " + y1 + ", height: " + height);
        d3.select(parent.node()).call(brush.move, y1 > height ? [height - dy, height] : y0 < 0 ? [0, dy] : [y0, y1]);
    }

    // Slider bounding box
    svg.append('line')
        .style("stroke", "var(--color-gray-light)")
        .style("stroke-width", 2)
        .attr("x1", margin.left - 1)
        .attr("y1", margin.top - 1)
        .attr("x2", w - margin.right + 1)
        .attr("y2", margin.bottom - 1)
    svg.append('line')
        .style("stroke", "var(--color-gray-light)")
        .style("stroke-width", 2)
        .attr("x1", margin.left - 1)
        .attr("y1", h - margin.bottom + 1)
        .attr("x2", w - margin.right + 1)
        .attr("y2", h - margin.bottom + 1)
    svg.append('line')
        .style("stroke", "var(--color-gray-light)")
        .style("stroke-width", 2)
        .attr("x1", margin.left)
        .attr("y1", margin.top - 1)
        .attr("x2", margin.left)
        .attr("y2", h - margin.bottom + 1)

    // select entire range
    console.log(brush);
    console.log(starting_range);
    console.log(y);
    console.log(starting_range.map(y));
    gBrush.call(brush.move, starting_range.map(y))

    $("#slider").append(svg.node());
    let getRange = function () {
        let range = d3.brushSelection(gBrush.node()).map(d => y.invert(d).toFixed(2));
        return [range[1], range[0]];
    }

    return {getRange: getRange}
}