import * as d3 from "https://cdn.skypack.dev/d3@7";
import axios from 'https://cdn.skypack.dev/axios';

/*
    this.a = elements.a; // Semi-major axis
    this.e = elements.e; // Eccentricity
    this.i = elements.i; // Inclination
    this.o = elements.o; // Longitude of ascending node
    this.w = elements.w; // Argument of periapsis
    this.m = elements.m; // Mean anomoly at epoch
 */
const dataSet = async function getData() {
    return await axios.get('/api/data');
}

//https://codepen.io/alandunning/pen/KpKjBW
//https://github.com/sgratzl/d3tutorial
d3.json("/json/asteroids_20210418_flat_period_calc_min2.json")
    .then((data) => {
        console.log(data.length);
        //console.log(data);

        let grouped = d3.group(data, d => d.a)

        //console.log(grouped)

        //d3.select("#chart").append("svg:svg")
        const width = 1200
        const height = 12000

        const groups = d3.select("svg")
            .style("width", width + 'px')
            .style("height", height + 'px')
            .selectAll("g")
            .data(grouped)
            .join("g");

        //groups.attr("transform", (d, i) => `translate(${i * 2 + 1},0)`);

        const circles = groups
            .selectAll("circle")
            .data((d) => {
                //console.log(d[1]);
                return d[1].filter(d => d.r < 100000)
            })
            .join("circle");

        circles.attr("r", (d, i) => {
            //console.log(d)
            return Math.max(1, d.r / 10000);
        })
            .attr("cx", (d, i) => getCx(i))
            .attr("cy", (d, i) => d.p * 4);
    })
    .catch((error) => {
        console.error("Error loading the data", error);
    });

function getCx(i) {
    return 600 + (i % 2 === 0 ? i * 2 : (i - 1) * -2)
}

/*
async function drawChart() {
    const data = [1, 2, 3];
    const circles = d3
        .select("svg")
        .selectAll("circle")
        .data(data)
        .join((enter) => {
            const circles_enter = enter.append("circle").attr("r", 10);
            // need to be separate since .append returns the appended element
            circles_enter.append("title");
            return circles_enter;
        });

    circles.attr("cx", (d, i) => d * 10).attr("cy", (d, i) => i * 50);

    circles.select("title").text((d) => d);
}

drawChart();*/
