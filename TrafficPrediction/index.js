var qm = require('qminer');
var trafficExpert = require('./TrafficExpert.js');
var server = require('./server/server.js');
var path = require('path');
var env = process.env.NODE_ENV || 'development';
var config = require('./config.json')[env];

// Set verbosity of QMiner internals
qm.verbosity(1);

// create Base in CLEAN CREATE mode
function cleanCreateMode() {
    // Initialise base in clean create mode   
    var base = new qm.Base({
        mode: 'createClean', 
        schemaPath: path.join(__dirname, './store.def'), // its more robust but, doesen't work from the console (doesent know __dirname)
        dbPath: path.join(__dirname, './db'),
    })
    
    // Init traffic prediction work flow
    trafficExpert.init(base); //Initiate the traffic prediction workflow
    
    // Import initial data
    console.log("\nTraining models...\n")
    qm.load.jsonFile(base.store("rawStore"), "./sandbox/data1.json ");
    
    //base.close();
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

//Just a wrapper around above function
//var createBase = {
//    cleanCreateMode: cleanCreateMode,
//    openMode: openMode,
//    readOnlyMode: readOnlyMode
//}

// Only one of bellow can be selected
//var base = createBase.cleanCreateMode();
//var base = createBase.openMode();
//var base = createBase.readOnlyMode();

// 
function createBase(mode) {
    var modes = {
        'cleanCreate': cleanCreateMode,
        'open': openMode,
        'openReadOnly': readOnlyMode
    };
    
    // check if mode type is valid
    if (typeof modes[mode] !== 'undefined') { 
        return modes[mode](); // execute function
    } else { 
        throw new Error("Base mode '" + mode + "' does not exist! Use one of this: 'cleanCreate', 'open', 'openReadOnly'")
    }
}

// read input script argument for mode type. Default is "cleanCreate"
var scriptArgs = (process.argv[2] == null) ? "cleanCreate" : process.argv[2];
var base = createBase(scriptArgs);

// START SERVER
server.init(base);
server.start(config.trafficPredictionService.server.port);

