var qm = require('qminer');
var path = require('path');

// Import my modules
Utils = require('./my_modules/utils/importData.js');

qm.delLock();
////var base = qm.create('qm.conf', '', true); // How can I spec dbPath??

//// Init data base
////qm.delLock();
//var base = new qm.Base({
//    mode: 'createClean', 
//    schemaPath: path.join(__dirname, './sensors.def'),
//    dbPath: path.join(__dirname, './db')
//})

//qm.load.jsonFile(base.store("CounterNode"), path.join(__dirname, "/sandbox/countersNodes.txt"));
////qm.load.jsonFile(base.store('trafficLoadStore'), path.join(__dirname, "/sandbox/measurements3sensors3months.txt"));
//qm.load.jsonFile(base.store('trafficLoadStore'), path.join(__dirname, "/sandbox/test.txt"));

//base.close()


//var base = new qm.Base({
//    mode: 'openReadOnly', 
//})

var cleanCreateMode = function () {
    //qm.delLock();
    //var base = qm.create('qm.conf', '', true); // How can I spec dbPath??
    
    // Init data base
    //qm.delLock();
    var base = new qm.Base({
        mode: 'createClean', 
        schemaPath: path.join(__dirname, './sensors.def'),
        dbPath: path.join(__dirname, './db')
    })
    
    qm.load.jsonFile(base.store("CounterNode"), path.join(__dirname, "/sandbox/countersNodes.txt"));
    //qm.load.jsonFile(base.store('trafficLoadStore'), path.join(__dirname, "/sandbox/measurements3sensors3months.txt"));
    qm.load.jsonFile(base.store('trafficLoadStore'), path.join(__dirname, "/sandbox/test.txt"));
    
    base.close();
    return base;
}

var readOnlyMode = function () {
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
//var base = createBase.cleanCreateMode();
//var base = createBase.openMode();
var base = createBase.readOnlyMode();

var root = "http://localhost:1337/traffic-predictions/add"; 
Utils.importData(root, [base.store('trafficLoadStore')], [base.store('trafficStore')])

