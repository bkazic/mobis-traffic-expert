var qm = require('qminer');
var TrafficExpert = require('./TrafficExpert.js');
var path = require('path');
var logger = require("./my_modules/utils/logger/logger.js");
Utils.Helper = require('./my_modules/utils/helper.js')

// create Base in CLEAN CREATE mode
function cleanCreateMode(trafficExpert) {
    // Initialise base in clean create mode   
    var base = new qm.Base({
        mode: 'createClean', 
        //schemaPath: path.join(__dirname, './store.def'), // its more robust but, doesen't work from the console (doesent know __dirname)
        dbPath: trafficExpert.pathDb
    })
    base["mode"] = 'cleanCreate'

    // Init traffic prediction work flow
    trafficExpert.init(base); //Initiate the traffic prediction workflow
    
    // Import sensor data
    //qm.load.jsonFile(base.store("sensorsStore"), path.join(__dirname, "./sandbox/sensors.json"))
}

// create Base in OPEN mode
function openMode(trafficExpert) {
    var base = new qm.Base({
        mode: 'open',
        dbPath: trafficExpert.pathDb //If the code is copied in terminal, this has to commented out, since __dirname is not known from terminal
    })
    base["mode"] = 'open'

    //Initiate the traffic prediction workflow
    trafficExpert.init(base);
    // load saved models
    trafficExpert.loadState();
}

// create Base in READ ONLY mode
function readOnlyMode(trafficExpert) {
    var base = new qm.Base({
        mode: 'openReadOnly',
        dbpath: trafficExpert.pathDb 
    })
    
    //Initiate the traffic prediction workflow
    trafficExpert.init(base);
    
    // load saved models
    trafficExpert.loadState();
}

function restoreFromBackup(trafficExpert) {
    // copy db from backup to db
    Utils.Helper.copyFolder(trafficExpert.pathBackup, trafficExpert.pathDb);
    
    // call openMode()
    openMode(trafficExpert);
}

// create Base in CLEAN CREATE mode and load init data
function cleanCreateLoadMode(trafficExpert) {
    // Initialise base in clean create mode   
    var base = new qm.Base({
        mode: 'createClean', 
        //schemaPath: path.join(__dirname, './store.def'), // its more robust but, doesen't work from the console (doesent know __dirname)
        dbPath: trafficExpert.pathDb 
    })
    base["mode"] = 'cleanCreateLoad'

    // Init traffic prediction work flow
    trafficExpert.init(base); //Initiate the traffic prediction workflow
    
    // Import initial data
    //qm.load.jsonFile(base.store("sensorsStore"), path.join(__dirname, "./sandbox/sensors.json"))
    //qm.load.jsonFile(base.store("rawStore_1"), path.join(__dirname, "./sandbox/data1.json"));
    
    //qm.load.jsonFile(base.store("rawStore_1"), path.join(__dirname, "./sandbox/data_id1.json"));
    //qm.load.jsonFile(base.store("rawStore_3"), path.join(__dirname, "./sandbox/data_id3.json"));
    //qm.load.jsonFile(base.store("rawStore_4"), path.join(__dirname, "./sandbox/data_id4.json"));
    //qm.load.jsonFile(base.store("rawStore_11"), path.join(__dirname, "./sandbox/data_id11.json"));
    //qm.load.jsonFile(base.store("rawStore_12"), path.join(__dirname, "./sandbox/data_id12.json"));
    
    for (var id = 1; id < 15; id++) {
        qm.load.jsonFile(base.store("rawStore_" + id), path.join(__dirname, "./sandbox/" + id + ".log"))
    }
}

// function that handles in which mode store should be opened
function start(trafficExpert, mode) {
    var modes = {
        'cleanCreate': cleanCreateMode,
        'cleanCreateLoad': cleanCreateLoadMode,
        'open': openMode,
        'openReadOnly': readOnlyMode,
        'restoreFromBackup': restoreFromBackup
    };
    
    // check if mode type is valid
    if (typeof modes[mode] === 'undefined') {
        modeOptions = [];
        for (option in modes) {
            modeOptions.push(option);
        }
        
        throw new Error("Base mode '" + mode + "' does not exist! Use one of this: " + modeOptions.toString())
    }

    // run appropriate function
    modes[mode](trafficExpert);
    
    //// schedule backuping and partialFlush-ing
    //setInterval(function () { base.partialFlush() }, 10 * 60 * 1000);
    //setInterval(function () { trafficExpert.backup(true); }, 10 * 1000);
    
    // create backup before running server
    trafficExpert.backup(true);
    
    logger.info("\x1b[32m[Model] Service started in '%s' mode\n\x1b[0m", mode);
}

exports.start = start;