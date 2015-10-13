var qm = require('qminer');
var path = require('path');
var env = process.env.NODE_ENV || 'development';
var config = require('./config.json')[env];
var scriptArgs = process.argv[2];

// Import my modules
Utils = require('./my_modules/utils/importData.js');
DefineStores = require('./my_modules/utils/defineStores.js')

sensorData = [
    { id: 1, name: "rawStore_1", filePath: path.join(__dirname, "./sandbox/data_id1.json") },
    { id: 3, name: "rawStore_3", filePath: path.join(__dirname, "./sandbox/data_id3.json") },
    { id: 4, name: "rawStore_4", filePath: path.join(__dirname, "./sandbox/data_id4.json") },
    { id: 11, name: "rawStore_11", filePath: path.join(__dirname, "./sandbox/data_id11.json") },
    { id: 12, name: "rawStore_12", filePath: path.join(__dirname, "./sandbox/data_id12.json") }
]

// create Base in CLEAN CREATE mode
function cleanCreateMode() {
    
    // Init data base
    var base = new qm.Base({
        mode: 'createClean', 
        //schemaPath: path.join(__dirname, './store.def'),
        dbPath: path.join(__dirname, './db')
    })
    
    var sensorsStore = DefineStores.createSensorsStore(base);
    var measurementStores = DefineStores.createMeasurementStores(base);
        
    // laod data to store
    if (typeof scriptArgs !== 'undefined') {
        qm.load.jsonFile(base.store("data"), path.join(__dirname, scriptArgs));
    } else {
    sensorData.forEach(function (sensor) { 
        qm.load.jsonFile(base.store(sensor.name), sensor.filePath);
        })
    }

    //base.close();
    return base;
}

// create Base in READ ONLY mode
function readOnlyMode() {
    var base = new qm.Base({
        mode: 'openReadOnly', 
    })
    return base;
}

//Just a wrapper around above function
var createBase = {
    cleanCreateMode: cleanCreateMode,
    //openMode: openMode,
    readOnlyMode: readOnlyMode
}


// Only one of bellow can be selected
var base = createBase.cleanCreateMode();
//var base = createBase.openMode();
//var base = createBase.readOnlyMode();

// Start importing records
var url = config.trafficPredictionService.root + "/traffic-predictions/add";
//Utils.importData(url, [base.store('data')], [base.store('data')])
//Utils.importData(url, [base.store('data')], [base.store('data')],100)
Utils.importData(url, sensorData.map(function (sensor) { return base.store(sensor.name) }), [])

