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
d3.json("/json/sample.json")
    .then((data) => {
        console.log(data.length);
        //console.log(data);

        let reduced = data.map((d) => d.orbital.a)
        reduced.sort()
        console.log(reduced)

        d3.select("svg")
            .selectAll("circle")
            .data(data)
            .join("circle")
            .attr("r", (d, i) => Math.max(1, d.r / 100000))
            .attr("cx", (d, i) => 100)
            .attr("cy", (d, i) => d.orbital.a * 100);
    })
    .catch((error) => {
        console.error("Error loading the data");
    });

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
