var express = require('express');
var router = express.Router();
var fs = require('fs');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Influence asteroid graphs'});
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
            newD.name = d.name;
            newD.r = d.r;
            newD.spectralType = d.spectralType;
            newD.a = d.orbital.a;
            newD.e = d.orbital.e;
            newD.p = getPeriod(d.orbital.a, 0.000007495);

            //if (newD.p >= 600 && newD.p <= 605) {
                newRecords.push(newD);
            //}

        });

        // compare semi-major axis. if equal, compare spectral type. if still equal, compare radius.
        newRecords.sort((d1, d2) => d1.a !== d2.a ? d1.a - d2.a : d1.spectralType !== d2.spectralType ? d1.spectralType - d2.spectralType : d2.r - d1.r)

        let i = 0;
        let last = newRecords[0];
        newRecords.forEach(d => {
            if (last.a !== d.a) {
                i = 0;
            }

            d.groupOrder = i++;
            last = d;
        })

        const jsonString = JSON.stringify(newRecords)
        fs.writeFile('./public/json/asteroids_20210418_grouped_ordered.json', jsonString, err => {
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

