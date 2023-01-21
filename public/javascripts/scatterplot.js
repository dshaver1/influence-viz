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

let plot = {};
const colors = ["black", "green", "teal", "purple", "yellow", "pink", "red", "blue", "gray", "orange", "darkgreen"]

//https://stackoverflow.com/questions/34653293/render-only-svg-nodes-of-data-that-is-currently-visible
//https://eng.wealthfront.com/2012/09/05/explore-your-multivariate-data-with-crossfilter/
//https://codepen.io/alandunning/pen/KpKjBW
//https://github.com/sgratzl/d3tutorial
d3.json("/json/asteroids_20210418_grouped_ordered.json")
    .then((data) => {
        console.log(data.length);
        console.log(data[1]);

        let cf = crossfilter2(data);
        let bySemiMajorAxis = cf.dimension(d => d.a || 0);
        bySemiMajorAxis.filter([3.8, 4]);

        //let p = rectPlotCount(data);
        //let p = binPlotCount(data);
        plot = scatterPlot(bySemiMajorAxis, {
            //x: d => d.r / 1000,
            x: d => d.groupOrder,
            y: d => d.a,
            r: 2,
            strokeWidth: 1,
            width: 1400,
            height: 20000,
            xDomain: [0, 310],
            yDomain: [0, 3.92],
            xLabel: "Count",
            yLabel: "Semi-major Axis (AU)"
            // xType: d3.scaleLog
        });

        $("#slider").change(function (ev) {
            let val = $(this).val();
            console.log("change! " + val);
            bySemiMajorAxis.filter([3.8 - val, 4 - val]);
            console.log(bySemiMajorAxis.top(Infinity));
            let XYI = plot.computeValues();
            plot.refresh(XYI[0], XYI[1], XYI[2], XYI[3]);
        });
    })
    .catch((error) => {
        console.error("Error loading the data", error);
    });

function scatterPlot(cf, {
    x = ([x]) => x, // given d in data, returns the (quantitative) x-value
    y = ([, y]) => y, // given d in data, returns the (quantitative) y-value
    r = 3, // (fixed) radius of dots, in pixels
    title, // given d in data, returns the title
    marginTop = 20, // top margin, in pixels
    marginRight = 30, // right margin, in pixels
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
    xDomain, // [xmin, xmax]
    xRange = [marginLeft + insetLeft, width - marginRight - insetRight], // [left, right]
    yType = d3.scaleLinear, // type of y-scale
    yDomain, // [ymin, ymax]
    yRange = [height - marginBottom - insetBottom, marginTop + insetTop], // [bottom, top]
    xLabel, // a label for the x-axis
    yLabel, // a label for the y-axis
    xFormat, // a format specifier string for the x-axis
    yFormat, // a format specifier string for the y-axis
    fill = "none", // fill color for dots
    stroke = "currentColor", // stroke color for the dots
    strokeWidth = 1.5, // stroke width for dots
    halo = "#fff", // color of label halo
    haloWidth = 3 // padding around the labels
} = {}) {
    // Compute values.
    function computeValues() {
        let data = cf.top(Infinity);
        let X = d3.map(data, x);
        let Y = d3.map(data, y);
        let I = d3.range(X.length).filter(i => !isNaN(X[i]) && !isNaN(Y[i]));
        return [X, Y, I, data];
    }

    let XYI = computeValues();

    // Compute default domains.
    if (xDomain === undefined) xDomain = d3.extent(XYI[0]);
    if (yDomain === undefined) yDomain = d3.extent(XYI[1]);

    // Construct scales and axes.
    const xScale = xType(xDomain, xRange);
    const yScale = yType(yDomain, yRange);
    const xAxis = d3.axisBottom(xScale).ticks(width / 80, xFormat);
    const yAxis = d3.axisLeft(yScale).ticks(height / 50, yFormat);

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
            .attr("x", width)
            .attr("y", marginBottom - 4)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text(xLabel));

    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
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

    let circleG = svg.append("g");

    function refresh(x, y, i, data) {
        let circle = circleG.selectAll("circle").data(i);

        circle.exit().remove();

        circle.enter()
            .append("circle")
            .attr("fill", i => colors[data[i].spectralType])
            .attr("stroke", i => colors[data[i].spectralType])
            .attr("stroke-width", strokeWidth)
            .attr("cx", i => xScale(x[i]))
            .attr("cy", i => yScale(y[i]))
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

    refresh(XYI[0], XYI[1], XYI[2], XYI[3]);

    document.body.append(svg.node());

    return {
        refresh: refresh,
        computeValues: computeValues
    };
}