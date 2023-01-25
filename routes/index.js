var express = require('express');
var router = express.Router();
var fs = require('fs');
var D3Node = require('d3-node');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Yet Another Asteroid Visualization'});
});

module.exports = router;


function write() {
    fs.readFile("./public/json/asteroids_20210418.json", function (err, data) {

        // Check for errors
        if (err) throw err;

        // Converting to JSON
        let records = JSON.parse(data);
        let newRecords = [];
        records.forEach(d => {
            let newD = {};
            newD.i = d.i;
            newD.name = d.name;
            newD.r = d.r;
            newD.spectralType = d.spectralType;
            newD.a = d.orbital.a;
            newD.e = d.orbital.e;
            newD.p = getPeriod(d.orbital.a, 0.000007495);

            if (newD.p > 799 && newD.p < 811) {
                newRecords.push(newD);
            }
        });

        const jsonString = JSON.stringify(newRecords)
        fs.writeFile('./public/json/asteroids_20210418_subset.json', jsonString, err => {
            if (err) {
                console.log('Error writing file', err)
            } else {
                console.log('Successfully wrote file')
            }
        })
    });
}

function write2() {
    fs.readFile("./public/json/asteroids_20210418.json", function (err, data) {

        // Check for errors
        if (err) throw err;

        // Converting to JSON
        let records = JSON.parse(data);
        let newRecords = [];
        records.forEach(d => {
            let newD = {};
            newD.i = d.i;
            newD.n = d.name;
            newD.r = d.r;
            newD.t = d.spectralType;
            newD.a = d.orbital.a;
            newD.e = d.orbital.e;
            newD.p = getPeriod(d.orbital.a, 0.000007495).toFixed(2);

            //if (newD.p >= 600 && newD.p <= 605) {
                newRecords.push(newD);
            //}

        });

        // compare semi-major axis. if equal, compare spectral type. if still equal, compare radius.
        newRecords.sort((d1, d2) => d1.a !== d2.a ? d1.a - d2.a : d1.t !== d2.t ? d1.t - d2.t : d2.r - d1.r)

        let i = 0;
        let last = newRecords[0];
        newRecords.forEach(d => {
            if (last.a !== d.a) {
                i = 0;
            }

            d.o = i++;
            last = d;
        })

        const d3n = new D3Node();

        let nested = d3n.d3.nest().key(d => d.a).entries(newRecords);

        nested.map(entry => {
           entry.c = entry.values.length;
        });

        //console.log(nested);


        const jsonString = JSON.stringify(nested)
        fs.writeFile('./public/json/asteroids_20210418_nested_count.json', jsonString, err => {
            if (err) {
                console.log('Error writing file', err)
            } else {
                console.log('Successfully wrote file')
            }
        })


    });
}


function getPeriod(a, thirdLaw) {
    //const thirdLaw = 0.000006421064256; // GM / 4*pi*pi for ~86% solar mass Adalia
    return Math.sqrt(Math.pow(a, 3) / thirdLaw);
}

//write2();

