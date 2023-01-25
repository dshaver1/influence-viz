import * as d3 from "https://cdn.skypack.dev/d3@7";
export function getOrbitalPeriodExtent(sliderRange) {
    return [getOrbitalPeriod(sliderRange[0]), getOrbitalPeriod(sliderRange[1])];
}

export function getOrbitalPeriod(a) {
    const thirdLaw = 0.000007495;
    return Math.sqrt(Math.pow(a, 3) / thirdLaw);
}

export function generateBinsBySpectralType(data) {
    let bins = d3.scaleLinear().domain([4, 0]).ticks(80);
    let histograms = bins.map(bin => {
        return [bin, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
    });

    data.forEach(d => {
        let binIndex = 0;
        for (let i = 0; i < 80; i++) {
            if (bins[i] < d.key) {
                binIndex = i;
                break;
            }
        }

        d.values.forEach(v => {
            histograms[binIndex][1][v.t] = histograms[binIndex][1][v.t] + 1;
            histograms[binIndex][1][11] = histograms[binIndex][1][11] + 1;
        })
    });

    return histograms;
}