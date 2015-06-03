// IMPORTS
var qm = require('qminer');
qm.delLock(); // lock has to be deleted before the new module import
var trafficPrediction = require('./TrafficPrediction.js');
var server = require('./server/server.js');
var path = require('path');

/*
// CREATE MODE
//qm.delLock();
//qm.config('qm.conf', true, 8080, 1024); //Not needed?
//var base = qm.create('qm.conf', '', true); // How can I spec dbPath?? You can't, this is an old way of creating store.

// Same as above, only a lot more verbose. The new way
// Init data base
//qm.verbosity(0); //Should work with the new QMiner
//qm.delLock();
//var base = new qm.Base({
//    mode: 'createClean', 
//    dbPath: path.join(__dirname, './db')
//})

//// OPEN MODE
//qm.delLock();
//var base = new qm.Base({
//    mode: 'open',
//    //dbPath: path.join(__dirname, './db') //If the code is copied in terminal, this has to commented out, since __dirname is not known from terminal
//})

// Init traffic prediction
//trafficPrediction.init(base); //Initiate the traffic prediction workflow


//// IMPORT DATA FROM FILE
////trafficPrediction.importData(base, "./sandbox/measurements_0011_11.txt")
////trafficPrediction.importData(base, "./sandbox/measurements_9_sens_3_mon.txt")
//trafficPrediction.importData(base, "./sandbox/measurements3sensors3months.txt")
//trafficPrediction.importData(base, "./sandbox/test.txt") // Small chuck of previous (from march on).

//base.close();

//// READ ONLY MODE

//qm.delLock();
var base = new qm.Base({
    mode: 'openReadOnly',
    //dbPath: path.join(__dirname, './db')
})
*/

// create Base in CLEAN CREATE mode
var cleanCreateMode = function () {
    qm.config('qm.conf', true, 8080, 1024); //Not needed?
    var base = qm.create('qm.conf', '', true); // How can I spec dbPath?? You can't, this is an old way of creating store.
    
    // Same as above, only a lot more verbose. The new way
    //qm.verbosity(0); //Should work with the new QMiner
    //var base = new qm.Base({
    //    mode: 'createClean', 
    //    dbPath: path.join(__dirname, './db')
    //})

    trafficPrediction.init(base); //Initiate the traffic prediction workflow
    //trafficPrediction.importData(base, "./sandbox/measurements3sensors3months.txt")
    
    //base.close();
    return base;
}

// create Base in OPEN mode
var openMode = function () {
    var base = new qm.Base({
        mode: 'open',
        //dbPath: path.join(__dirname, './db') //If the code is copied in terminal, this has to commented out, since __dirname is not known from terminal
    })
    trafficPrediction.init(base); //Initiate the traffic prediction workflow
    return base;
}

// create Base in READ ONLY mode
var readOnlyMode = function () {
    var base = new qm.Base({
        mode: 'openReadOnly',
        //dbpath: path.join(__dirname, './db')
    })
    return base;
}

//Just a wrapper around above function
var createBase = {
    cleanCreateMode: cleanCreateMode,
    openMode: openMode,
    readOnlyMode: readOnlyMode
}

// DELETE THE HUGE COMMENT ABOVE ONCE YOU TEST ALL THIS FUNCTIONS:
// TESTED: createBase.cleanCreateMode(); 
// NOT TESTED: createBase.openMode();
// TESTED: var base = createBase.openMode(); 

// Only one of bellow can be selected
var base = createBase.cleanCreateMode();
//var base = createBase.openMode();
//var base = createBase.readOnlyMode();

// START SERVER
server.init(base);
server.start();

