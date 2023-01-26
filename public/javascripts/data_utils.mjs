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

export function fillConstellationGap(key1, key2) {
    let diff = Math.abs(key2 - key1);
    let numberOfElementsToAdd = roundNumTo3(diff) / 0.001;
    let elementsToAdd = [];

    for (let j = 1; j < numberOfElementsToAdd; j++) {
        let newKey = roundNumTo3(key2 + (j * 0.001));
        //console.log("currentKey: " + key2 + ", lastKey: " + key1 + ", newKey: " + newKey + ", j: " + j + ", diff: " + diff + ", numberOfElementsToAdd: " + numberOfElementsToAdd);
        elementsToAdd.push(createEmptyConstellation(newKey))
    }

    return elementsToAdd;
}

export function fillAllGaps(data) {
    let last = data[data.length-1];
    let current = data[data.length-1];
    for (let i = data.length-1; i >=0; i--) {
        current = data[i];
        let currentKey = Math.round((parseFloat(current.key) + Number.EPSILON) * 1000) / 1000;
        let lastKey = Math.round((parseFloat(last.key) + Number.EPSILON) * 1000) / 1000;

        let diff = Math.abs(currentKey - lastKey);
        if (diff > 0.001) {
            let elementsToAdd = fillConstellationGap(lastKey, currentKey);

            data.splice(i+1, 0, ...elementsToAdd)
        }

        last = data[i];
    }

    // add a few empty 'constellations' to the beginning and end
    let upperAdditions = fillConstellationGap(4, Math.round((parseFloat(data[data.length-1].key) + Number.EPSILON) * 1000) / 1000);
    data.push(...upperAdditions);
    let lowerBound = roundStringTo3(data[0].key) - 0.08;
    let lowerAdditions = fillConstellationGap(Math.round((parseFloat(data[0].key) + Number.EPSILON) * 1000) / 1000, lowerBound);
    data.unshift(...lowerAdditions);
}

export function createEmptyConstellation(key) {
    return {key: key.toFixed(3), values: [], c: 0}
}

export function roundStringTo3(numberString) {
    return Math.round((parseFloat(numberString) + Number.EPSILON) * 1000) / 1000
}

export function roundNumTo3(number) {
    return Math.round((number + Number.EPSILON) * 1000) / 1000
}