var assert = require("assert");
var qm = require("qminer"); 
var LocalizedAverage = require('../localized-average.js');
var path = require('path');

// CREATE DATABASE
var base = new qm.Base({
    mode: 'createClean',
    schema: [
        {
            "name": "testStore",
            "fields": [
                { "name": "DateTime", "type": "datetime", "primary": true },
                { "name": "NumOfCars", "type": "float", "null": true },
                { "name": "Gap", "type": "float", "null": true },
                { "name": "Occupancy", "type": "float", "null": true },
                { "name": "Speed", "type": "float", "null": true },
                { "name": "TrafficStatus", "type": "float", "null": true }
            ]
        }
    ],
    dbPath: path.join(__dirname, './db')
});

qm.load.jsonFile(base.store("testStore"), path.join(__dirname , './measurements_0011_11.txt'));
//base.close()

// OPEN DATABSE
//var base = new qm.Base({
//    mode: 'open',
//    schema: [
//        {
//            "name": "testStore",
//            "fields": [
//                { "name": "DateTime", "type": "datetime", "primary": true },
//                { "name": "NumOfCars", "type": "float", "null": true },
//                { "name": "Gap", "type": "float", "null": true },
//                { "name": "Occupancy", "type": "float", "null": true },
//                { "name": "Speed", "type": "float", "null": true },
//                { "name": "TrafficStatus", "type": "float", "null": true }
//            ]
//        }
//    ],
//    //dbPath: path.join(__dirname, './db')
//});


var locAvr = new LocalizedAverage({ fields: { name: "NumOfCars" } });

var testStore = base.store('testStore');
testStore.each(function (rec) { 
    console.log(locAvr.update(rec));
})
//console.log(locAvr.update(testStore.first))

base.close();
