var qm = require('qminer');
var path = require('path');
var config = require('./config-debug.js');
//var config = require('./config-release.js');
var scriptArgs = process.argv[2];

// Import my modules
Utils = require('./my_modules/utils/importData.js');

qm.delLock();

// create Base in CLEAN CREATE mode
function cleanCreateMode() {
    //qm.delLock();
    //var base = qm.create('qm.conf', '', true); // How can I spec dbPath??
    
    // Init data base
    //qm.delLock();
    var base = new qm.Base({
        mode: 'createClean', 
        schemaPath: path.join(__dirname, './store.def'),
        dbPath: path.join(__dirname, './db')
    })
    
    // file to import
    var fileName = "/sandbox/data-new.json";
    
    // override filename if script argument is defined
    if (typeof scriptArgs !== 'undefined') { 
        fileName = scriptArgs;
    } 
    
    // load data to store
    qm.load.jsonFile(base.store("sensors"), path.join(__dirname, "/sandbox/sensors.json"));
    qm.load.jsonFile(base.store("data"), path.join(__dirname, fileName));
  
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
Utils.importData(url, [base.store('data')], [base.store('data')])
//Utils.importData(url, [base.store('data')], [base.store('data')],100)

