var qm = require('qminer');
var trafficExpert = require('./TrafficExpert.js');
var path = require('path');
var logger = require("./my_modules/utils/logger/logger.js");

// create Base in CLEAN CREATE mode
function cleanCreateMode() {
    // Initialise base in clean create mode   
    var base = new qm.Base({
        mode: 'createClean', 
        //schemaPath: path.join(__dirname, './store.def'), // its more robust but, doesen't work from the console (doesent know __dirname)
        dbPath: path.join(__dirname, './db'),
    })
    
    // Init traffic prediction work flow
    trafficExpert.init(base); //Initiate the traffic prediction workflow
    
    // Import sensor data
    //qm.load.jsonFile(base.store("sensorsStore"), path.join(__dirname, "./sandbox/sensors.json"))

    return base;
}

// create Base in OPEN mode
function openMode() {
    var base = new qm.Base({
        mode: 'open',
        //dbPath: path.join(__dirname, './db') //If the code is copied in terminal, this has to commented out, since __dirname is not known from terminal
    })
    trafficExpert.init(base); //Initiate the traffic prediction workflow
    return base;
}

// create Base in READ ONLY mode
function readOnlyMode() {
    var base = new qm.Base({
        mode: 'openReadOnly',
        dbpath: path.join(__dirname, './db')
    })
    return base;
}

// create Base in CLEAN CREATE mode and load init data
function cleanCreateLoadMode() {
    // Initialise base in clean create mode   
    var base = new qm.Base({
        mode: 'createClean', 
        schemaPath: path.join(__dirname, './store.def'), // its more robust but, doesen't work from the console (doesent know __dirname)
        dbPath: path.join(__dirname, './db'),
    })
    
    // Init traffic prediction work flow
    trafficExpert.init(base); //Initiate the traffic prediction workflow
    
    // Import initial data
    qm.load.jsonFile(base.store("sensorsStore"), path.join(__dirname, "./sandbox/sensors.json"))
    qm.load.jsonFile(base.store("rawStore"), path.join(__dirname, "./sandbox/data1.json"));
    logger.info("Training models...")
    
    debugger

    return base;
}

// function that handles in which mode store should be opened
function createBase(mode) {
    var modes = {
        'cleanCreate': cleanCreateMode,
        'cleanCreateLoad': cleanCreateLoadMode,
        'open': openMode,
        'openReadOnly': readOnlyMode
    };
    
    // check if mode type is valid
    if (typeof modes[mode] === 'undefined') {
        throw new Error("Base mode '" + mode + "' does not exist!" + 
            "Use one of this: 'cleanCreate', 'cleanCreateLoad', 'open', 'openReadOnly'")
    }
    
    // run appropriate function
    var base = modes[mode]();
    base["mode"] = mode;
    
    logger.info("\x1b[32m[Model] Service started in '%s' mode\n\x1b[0m", mode)
    
    return base;
}

exports.mode = createBase;
