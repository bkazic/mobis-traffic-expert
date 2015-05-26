var qm = require('qminer');
var path = require('path');

// Import my modules
Utils = require('./my_modules/utils/importData.js');

//qm.delLock();
//var base = qm.create('qm.conf', '', true); // How can I spec dbPath??

// Init data base
//qm.delLock();
//var base = new qm.Base({
//    mode: 'createClean', 
//    schemaPath: path.join(__dirname, './sensors.def'),
//    dbPath: path.join(__dirname, './db')
//})

//qm.load.jsonFile(base.store("CounterNode"), path.join(__dirname, "/sandbox/countersNodes.txt"));
//qm.load.jsonFile(base.store('trafficLoadStore'), path.join(__dirname, "/sandbox/measurements3sensors3months.txt"));

//base.close()

var base = new qm.Base({
    mode: 'openReadOnly', 
})

////var root = "http://localhost:8080/ServerReciever/reciever?data=";
//var root = "http://localhost:8080/TrafficPrediction/importData?data=";
////var root = "http://mustang.ijs.si:9569/TrafficPrediction/importData?data=";
var root = "http://localhost:1337/add"; 
Utils.importData(root, [base.store('trafficLoadStore')], [base.store('trafficStore')])


//////////// TEST WITH REQUEST MODULE ////////////

//var request = require('request');

//var url = 'http://localhost:1337/add';
//var rec = { "test": "burek" };

////console.log("Sending request: " + JSON.stringify(form))
//request.post( url, { json: rec }, function (error, response, body) {
//    if (!error && response.statusCode == 200) {
//        console.log("Response: " + body)
//    }
//});

