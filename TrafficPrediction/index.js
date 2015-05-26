// IMPORTS
var qm = require('qminer');
var trafficPrediction = require('./TrafficPrediction.js');
var server = require('./server/server.js');
var path = require('path');


// CREATE MODE

//qm.delLock();
////qm.config('qm.conf', true, 8080, 1024);
//var base = qm.create('qm.conf', '', true); // How can I spec dbPath??

////// Init data base
////qm.delLock();
////var base = new qm.Base({
////    mode: 'createClean', 
////    dbPath: path.join(__dirname, './db')
////})


//// Init traffic prediction
//trafficPrediction.init(base);


//// IMPORT DATA
////trafficPrediction.importData(base, "./sandbox/measurements_0011_11.txt")
////trafficPrediction.importData(base, "./sandbox/measurements_9_sens_3_mon.txt")
//trafficPrediction.importData(base, "./sandbox/measurements3sensors3months.txt")


//base.close();



// READ ONLY MODE

//qm.delLock();
var base = new qm.Base({
    mode: 'openReadOnly',
    //dbPath: path.join(__dirname, './db')
})

// START SERVER
server.init(base);
server.start();

