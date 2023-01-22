import * as d3 from "https://cdn.skypack.dev/d3@7";
import crossfilter2 from 'https://cdn.skypack.dev/crossfilter2';

/*
    this.a = elements.a; // Semi-major axis
    this.e = elements.e; // Eccentricity
    this.i = elements.i; // Inclination
    this.o = elements.o; // Longitude of ascending node
    this.w = elements.w; // Argument of periapsis
    this.m = elements.m; // Mean anomoly at epoch
 */

const colors = ["black", "green", "teal", "purple", "yellow", "pink", "red", "blue", "gray", "orange", "darkgreen"]
const layout = ({
    width: 200,
    height: 800,
    margin: {
        top: 40,
        bottom: 40,
        left: 40,
        right: 40
    }
});
let plot = {};
let xDomain = [0, 310];
let yDomain = {};
let xScale = {};
let yScale = {};
let y2Scale = {};
let xAxis = {};
let yAxis = {};
let y2Axis = {};

d3.json("/json/asteroids_20210418_grouped_ordered.json")
    .then((data) => {
        console.log(data.length);
        console.log(data[1]);

        let s = slider(0, 4, 3.9, 4);

        let cf = crossfilter2(data);
        let bySemiMajorAxis = cf.dimension(d => d.a || 0);
        console.log("s.getRange(): " + s.getRange());
        bySemiMajorAxis.filter(s.getRange());

        plot = scatterPlot(bySemiMajorAxis, {
            //x: d => d.r / 1000,
            x: d => d.groupOrder,
            y: d => d.a,
            r: 2,
            strokeWidth: 1,
            width: 1200,
            height: 800,
            xLabel: "Count",
            yLabel: "Semi-major Axis (AU)"
        });

        d3.select('.eventhandler').on('a-change', function () {
            let updatedValues = s.getRange();
            console.log("change!");
            console.log(updatedValues);

            bySemiMajorAxis.filter(updatedValues);
            //console.log(bySemiMajorAxis.top(Infinity));
            let data = plot.computeValues();
            yDomain = updatedValues;
            plot.refresh(data);
        })
    })
    .catch((error) => {
        console.error("Error loading the data", error);
    });

function scatterPlot(cf, {
    r = 3, // (fixed) radius of dots, in pixels
    marginTop = 20, // top margin, in pixels
    marginRight = 40, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 40, // left margin, in pixels
    inset = r * 2, // inset the default range, in pixels
    insetTop = inset, // inset the default y-range
    insetRight = inset, // inset the default x-range
    insetBottom = inset, // inset the default y-range
    insetLeft = inset, // inset the default x-range
    width = 640, // outer width, in pixels
    height = 400, // outer height, in pixels
    xType = d3.scaleLinear, // type of x-scale
    xRange = [marginLeft + insetLeft, width - marginRight - insetRight], // [left, right]
    yType = d3.scaleLinear, // type of y-scale
    yRange = [height - marginBottom - insetBottom, marginTop + insetTop], // [bottom, top]
    xLabel, // a label for the x-axis
    yLabel, // a label for the y-axis
    xFormat, // a format specifier string for the x-axis
    yFormat // a format specifier string for the y-axis
} = {}) {
    // Compute values.
    function computeValues() {
        return cf.top(Infinity);
    }

    let values = computeValues();

    // Compute default domains.
    yDomain = [3.7, 4];

    console.log(yDomain);
    console.log(yRange);

    // Construct scales and axes.
    xScale = xType(xDomain, xRange);
    yScale = yType(yDomain, yRange);
    let y2Extent = getOrbitalPeriodExtent(yDomain);
    console.log("y2Extent");
    console.log(y2Extent);
    y2Scale = yType(y2Extent, yRange);
    xAxis = d3.axisBottom(xScale).ticks(width / 80, xFormat);
    yAxis = d3.axisLeft(yScale).ticks(height / 50, yFormat);
    y2Axis = d3.axisRight(y2Scale).ticks(height / 50, yFormat);

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("y2", marginTop + marginBottom - height)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", width-marginRight)
            .attr("y", marginBottom - 4)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text(xLabel));

    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .attr("class", "yaxis")
        .call(yAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - marginLeft - marginRight)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", -marginLeft)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text(yLabel));

    svg.append("g")
        .attr("transform", `translate(${width-marginRight},0)`)
        .attr("class", "y2axis")
        .call(y2Axis)
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", -60)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text("Orbital Period (Days)"));

    let circleG = svg.append("g");

    function refresh(values) {
        yScale.domain(yDomain)
        svg.selectAll("g.yaxis")
            .transition().duration(1000)
            .call(yAxis);

        y2Scale.domain(getOrbitalPeriodExtent(yDomain))
        svg.selectAll("g.y2axis")
            .transition().duration(1000)
            .call(y2Axis);

        console.log(values);

        let circle = circleG.selectAll("circle").data(values, function (d) {
            return d ? d.name : this.id;
        })
            .join(
                enter => enter.append("circle").transition().duration(1000)
                    .attr("cx", d => xScale(d.groupOrder))
                    .attr("cy", d => yScale(d.a)),
                update => update.transition().duration(1000)
                    .attr("cx", d => xScale(d.groupOrder))
                    .attr("cy", d => yScale(d.a)),
                exit => exit.transition().duration(1000)
                    .attr("cx", d => xScale(d.groupOrder))
                    .attr("cy", d => yScale(d.a))
                    .remove()
            )
            .attr("fill", d => d.spectralType)
            .attr("stroke", d => d.spectralType)
            //.attr("stroke-width", strokeWidth)
            .attr("r", r)
            .on('mouseover', function (d, i) {
                d3.select(this).transition()
                    .duration('100')
                    .attr("r", 7);
            })
            .on('mouseout', function (d, i) {
                d3.select(this).transition()
                    .duration('200')
                    .attr("r", r);
            });
    }

    refresh(values);

    $("#chart1").append(svg.node());

    return {
        refresh: refresh,
        computeValues: computeValues
    };
}

function slider(min, max, starting_min = min, starting_max = max) {

    var range = [max, min]
    var starting_range = [starting_max, starting_min]

    // set width and height of svg
    var w = layout.width
    var h = layout.height
    var margin = layout.margin

    // dimensions of slider bar
    var width = w - margin.left - margin.right;
    var height = h - margin.top - margin.bottom;

    // create x scale
    var y = d3.scaleLinear()
        .domain(range)  // data space
        .range([0, height]);  // display space

    // create svg and translated g
    var svg = d3.create("svg")
        .attr("width", w)
        .attr("height", h)
    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

    // labels
    var labelL = g.append('text')
        .attr('id', 'labelleft')
        .attr('x', width)
        .attr('y', 0)

    var labelR = g.append('text')
        .attr('id', 'labelright')
        .attr('x', width)
        .attr('y', 0)

    // define brush
    var brush = d3.brushY()
        .extent([[0, 0], [width, height]])
        .on('brush', function (event) {
            var s = event.selection;
            //console.log("brush event!");
            //console.log(s);
            // update and move labels
            labelL.attr('y', s[0])
                .text((y.invert(s[0]).toFixed(2)))
            labelR.attr('y', s[1])
                .text((y.invert(s[1]).toFixed(2)))
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
    var gBrush = g.append("g")
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

function getOrbitalPeriodExtent(sliderRange) {
    return [getOrbitalPeriod(sliderRange[0]), getOrbitalPeriod(sliderRange[1])];
}

function getOrbitalPeriod(a) {
    const thirdLaw = 0.000007495;
    return Math.sqrt(Math.pow(a, 3) / thirdLaw);
}