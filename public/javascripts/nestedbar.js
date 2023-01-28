import * as d3 from "https://cdn.skypack.dev/d3@7";
import crossfilter2 from 'https://cdn.skypack.dev/crossfilter2';
import {slider} from './slider.mjs'
import {
    getOrbitalPeriodExtent,
    generateBinsBySpectralType,
    fillAllGaps
} from './data_utils.mjs'


const colors = ["white", "green", "teal", "purple", "yellow", "pink", "red", "blue", "gray", "orange", "steelblue"]
const SPECTRAL_TYPES = {
    0: { name: 'C', resources: [1, 6, 7, 8, 9, 10, 11] },
    1: { name: 'Cm', resources: [1, 6, 7, 8, 9, 10, 11, 18, 19, 20, 21, 22] },
    2: { name: 'Ci', resources: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
    3: { name: 'Cs', resources: [1, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] },
    4: { name: 'Cms', resources: [1, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22] },
    5: { name: 'Cis', resources: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] },
    6: { name: 'S', resources: [12, 13, 14, 15, 16, 17] },
    7: { name: 'Sm', resources: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22] },
    8: { name: 'Si', resources: [1, 2, 3, 4, 5, 6, 7, 8, 12, 13, 14, 15, 16, 17] },
    9: { name: 'M', resources: [18, 19, 20, 21, 22] },
    10: { name: 'I', resources: [1, 2, 3, 4, 5, 6, 7, 8] }
};
const getSize = (radius) => {
    if (radius <= 5000) return SIZES[0];
    if (radius <= 20000) return SIZES[1];
    if (radius <= 50000) return SIZES[2];
    return SIZES[3];
};
const SIZES = ['Small', 'Medium', 'Large', 'Huge'];
const layout = ({
    width: 200,
    height: 800,
    margin: {
        top: 40,
        bottom: 40,
        left: 40,
        right: 20
    }
});
let plot = {};
let xDomain = [0, 310];
let yDomain = {};
let y2Domain = {};
let xScale = {};
let yScale = {}; // Data bar scale
let y2Scale = {}; // Orbital period
let y3Scale = {}; // semi-major axis
let xAxis = {};
let yAxis = {};
let y2Axis = {};
let cf = {};
let tooltip = d3.select("#chart1")
    .append("div")
    .attr("class", "notification")
    .attr("style", "position: absolute")
    .style("opacity", 0);
let selectedBar = {};

/**
 *
 *             i = influence asteroidId (biggest first)
 *             n = influence base name (VK-1928)
 *             r = radius
 *             t = spectralType
 *             a = semi-major axis
 *             e = eccentricity
 *             p = orbital period
 *             o = order in the constellation, biggest first.
 *             c = total number of asteroids in a constellation
 *             constellation = a group of asteroids at the same semi-major axis to a precision of 0.001
 *
 */
d3.json("/json/asteroids_20210418_nested_count.json")
    .then((data) => {
        console.log(data.length);
        console.log(data[1]);

        fillAllGaps(data);

        let histogramBinsByt = generateBinsBySpectralType(data);

        cf = crossfilter2(data);
        let bySemiMajorAxis = cf.dimension(d => d.key || 0);
        let s = slider(histogramBinsByt, 0, 4, layout, colors, 0.96, 1.06);
        bySemiMajorAxis.filter(s.getRange());


        plot = barPlot(bySemiMajorAxis, {
            strokeWidth: 1,
            width: 1200,
            height: 800,
            xLabel: "Asteroid Count ⇁",
            yLabel: "Semi-major Axis (AU)"
        });

        d3.select('.eventhandler').on('a-change', function () {
            let updatedValues = s.getRange();

            bySemiMajorAxis.filter(updatedValues);
            //console.log(bySemiMajorAxis.top(Infinity));
            let data = plot.computeValues();
            yDomain = bySemiMajorAxis.top(Infinity).map(d => d.key).reverse();
            y2Domain = updatedValues;
            plot.refresh(data);
        })
    })
    .catch((error) => {
        console.error("Error loading the data", error);
    });

function barPlot(cf, {
    marginTop = 20, // top margin, in pixels
    marginRight = 40, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 40, // left margin, in pixels
    inset = 6, // inset the default range, in pixels
    insetTop = inset, // inset the default y-range
    insetRight = inset, // inset the default x-range
    insetBottom = inset, // inset the default y-range
    insetLeft = inset, // inset the default x-range
    width = 640, // outer width, in pixels
    height = 400, // outer height, in pixels
    xType = d3.scaleLinear, // type of x-scale
    xRange = [marginLeft + insetLeft, width - marginRight - insetRight], // [left, right]
    yType = d3.scaleBand, // type of y-scale
    y2Type = d3.scaleLinear,
    yRange = [height - marginBottom - insetBottom, marginTop + insetTop], // [bottom, top]
    xLabel, // a label for the x-axis
    yLabel, // a label for the y-axis
    xFormat, // a format specifier string for the x-axis
    yFormat = "~r" // a format specifier string for the y-axis
} = {}) {
    // Compute values.
    function computeValues() {
        return cf.top(Infinity);
    }

    let values = computeValues();

    // Compute default domains.
    yDomain = values.map(d => d.key).reverse();
    y2Domain = [0.96, 1.06];

    // Construct scales and axes.
    xScale = xType(xDomain, xRange);
    yScale = yType(yDomain, yRange).padding(0.4);

    let y2Extent = getOrbitalPeriodExtent(yDomain);
    y2Scale = d3.scaleLinear()
        .domain(y2Extent)
        .range(yRange);

    let offset = yScale.step() * yScale.padding();
    console.log("offset: " + offset);

    let y3Range = [yRange[0] - offset, yRange[1] + offset];
    console.log("yRange: " + yRange);
    console.log("y3Range: " + y3Range);

    y3Scale = d3.scaleLinear()
        .domain(y2Domain)
        .range(y3Range);
    xAxis = d3.axisBottom(xScale).ticks(width / 80, xFormat);
    yAxis = d3.axisLeft(y3Scale).ticks(height / 50, yFormat)
        .tickSize(-(width - marginRight - marginLeft));
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
            .attr("class", "axis-label")
            .attr("x", marginLeft + 100)
            .attr("y", marginBottom - 3)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text(xLabel));

    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .attr("class", "yaxis")
        .call(yAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line")
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("class", "axis-label")
            .attr("x", -marginLeft)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text(yLabel));

    svg.append("g")
        .attr("transform", `translate(${width - marginRight},0)`)
        .attr("class", "y2axis")
        .call(y2Axis)
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("class", "axis-label")
            .attr("x", -90)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text("Orbital Period (Days)"));

    let barG = svg.append("g").attr("fill", "var(--color-gray-light)").attr("cursor", "var(--cursor-url-active) 5 5, auto");

    function refresh(values) {
        yScale.domain(yDomain);

        y2Scale.domain(getOrbitalPeriodExtent(y2Domain))
        svg.selectAll("g.y2axis")
            .transition().duration(1000)
            .call(y2Axis);

        let y3offset = yScale.step() * yScale.padding();
        console.log("y3offset: " + y3offset);

        let y3Range = [yRange[0] - y3offset, yRange[1] + y3offset];

        y3Scale.domain(y2Domain).range(y3Range);
        svg.selectAll("g.yaxis")
            .transition().duration(1000)
            .call(yAxis)
            .call(g => g.selectAll(".tick line")
                .attr("stroke-opacity", 0.1));

        let bar = barG.selectAll("rect").data(values).join(
            enter => enter.append("rect")
                .attr("class", "bar")
                .attr("x", xScale(0))
                .attr("y", d => yScale(d.key))
                .transition().duration(1000)
                .attr("height", yScale.bandwidth())
                .attr("width", d => xScale(d.c) - xScale(0)),
            update => update
                .transition().duration(1000)
                .attr("x", xScale(0))
                .attr("y", d => yScale(d.key))
                .attr("height", yScale.bandwidth())
                .attr("width", d => xScale(d.c) - xScale(0)),
            exit => exit
                .transition().duration(200)
                .attr("width", 0)
                .remove()
        ).on('mouseover', function (event, d) {
            d3.select(this).transition()
                .duration('100')
                .attr("class", "selected-bar");
            tooltip.transition()
                .duration('100')
                .style("opacity", 1);
        }).on('mouseout', function (event, d) {
            let clazz = this === selectedBar ? "selected-bar" : "bar";
            d3.select(this).transition()
                .duration('400')
                .attr("class", clazz);
            tooltip
                .transition()
                .style("opacity", 0);
        }).on('mousemove', function (event, d) {
            tooltip
                .html("Semi-major Axis: " + d.key + " AU<br />Orbital Period: " + d.values[0].p + " days<br />Asteroid Count: " + d.c)
                .style("left", event.pageX + 5 + "px")
                .style("top", event.pageY + "px")
        }).on('click', function (event, d) {
            console.log("click event!");
            console.log(d);
            selectedBar = this;
            d3.selectAll(".selected-bar").attr("class", "bar");
            d3.select(this).attr("class", "selected-bar");

            d3.select("#table1-wrapper").attr("style", "display:block")

            d3.select("#table1-header")
                    .html("<h3>Constellation " + parseFloat(d.values[0].p).toFixed(1) + "</h3>")

            d3.select(".list-expanding-items").selectAll("li").data(d.values)
                .join(enter => {
                    let li = enter.append("li");
                    li.append("div")
                        .attr("class", "item-title")
                        .html(d => d.n + " - " + getSize(d.r) + " " + SPECTRAL_TYPES[d.t].name + "-type");
                    li.append("div")
                        .attr("class", "item-expand")
                        .html(d => "<br/>e: " + d.e + ",r: " + d.r + ",i: " + d.i);
                }, update => {
                    update.select(".item-title")
                        .html(d => d.n + " - " + getSize(d.r) + " " + SPECTRAL_TYPES[d.t].name + "-type");
                    update.select(".item-expand")
                        .html(d => "<br/>e: " + d.e + ",r: " + d.r + ",i: " + d.i);
                })
        });
    }

    refresh(values);

    $("#chart1").append(svg.node());

    return {
        refresh: refresh,
        computeValues: computeValues
    };
}