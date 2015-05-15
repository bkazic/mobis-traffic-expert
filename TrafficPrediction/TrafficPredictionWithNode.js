/**
 * Copyright (c) 2015, Jozef Stefan Institute, Quintelligence d.o.o. and contributors
 * All rights reserved.
 * 
 * This source code is licensed under the FreeBSD license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Import modules
var qm = require('qminer');
var server = require('./server.js');
// TODO: port evaluation as qm module

// Define stores
qm.delLock();
qm.config('qm.conf', true, 8080, 1024);
var base = qm.create('qm.conf', 'sensors.def', true);
//global.base = qm.create('qm.conf', 'sensors.def', true);

// Import my modules
evaluation = require('./my_modules/utils/evaluation.js')
Utils = {};
Utils.Data = require('./my_modules/utils/importData.js');
//Utils.Model = require('./my_modules/utils/model.js');
Utils.SpecialDates = require('./my_modules/utils/specialDates.js')

var CounterNode = base.store("CounterNode");
var Evaluation = base.store("Evaluation");
var Predictions = base.store("Predictions");
var trafficLoadStore = base.store('trafficLoadStore');
var trafficStore = base.store('trafficStore');
//var mergedStore = base.store('mergedStore'); 
var resampledStore = base.store('resampledStore');


///////////////////// PREPROCESSING FOR TRAFFIC DATA SOURCE /////////////////////
// Replaces incorect speed values, with avr value
// TODO


//////////////////////////// RESAMPLING MERGED STORE ////////////////////////////
// This resample aggregator creates new resampled store
var resampleInterval = 60 * 60 * 1000;
//qm.newStreamAggr({ //TODO: test if it would work with this?
trafficStore.addStreamAggr({
    name: "Resampled", type: "resampler",
    outStore: resampledStore.name, timestamp: "DateTime",
    fields: [{ name: "NumOfCars", interpolator: "linear" },
             { name: "Gap", interpolator: "linear" },
             { name: "Occupancy", interpolator: "linear" },
             { name: "Speed", interpolator: "linear" },
             { name: "TrafficStatus", interpolator: "linear" },
    ],
    createStore: false, interval: resampleInterval
});

// TODO: strange: this part throws errors if executed directly from node
// Ads a join back, since it was lost with resampler
resampledStore.addStreamAggr({
    name: "addJoinsBack",
    onAdd: function (rec) {
        rec.addJoin("measuredBy", trafficStore.last.measuredBy)
    },
    saveJson: function () { return {} }

    //saveJson: function () { }
})



////////////////////////////// DEFINING FEATURE SPACE //////////////////////////////
var modelConf = {
    base: base,
    stores: {
        //"sourceStore": resampledStore,
        //"predictionStore": Predictions,
        //"evaluationStore": Evaluation,
        "sourceStore": resampledStore,
        "predictionStore": Predictions,
        "evaluationStore": Evaluation,
    },
    fields: [ // From this, feature space could be build.
        { name: "NumOfCars" },
        { name: "Gap" },
        { name: "Occupancy" },
        { name: "Speed" },
        { name: "TrafficStatus" },
    ],
    
    featureSpace: [
        { type: "constant", source: resampledStore.name, val: 1 },
            //{ type: "numeric", source: store.name, field: "Ema1", normalize: false },
            //{ type: "numeric", source: store.name, field: "Ema2", normalize: false },
        { type: "numeric", source: resampledStore.name, field: "Speed", normalize: false },
        { type: "numeric", source: resampledStore.name, field: "NumOfCars", normalize: false },
        { type: "numeric", source: resampledStore.name, field: "Gap", normalize: false },
        { type: "numeric", source: resampledStore.name, field: "Occupancy", normalize: false },
        { type: "numeric", source: resampledStore.name, field: "TrafficStatus", normalize: false },
            //{ type: "jsfunc", source: store.name, name: "AvrVal", fun: getAvrVal.getVal },
        //{ type: "jsfunc", source: store.name, name: "AvrVal", fun: avrVal.getVal },
    ],
    
    predictionFields: [ //TODO: Not sure, if I want to use names of fields or fields??
        { field: resampledStore.field("NumOfCars") },
        { field: resampledStore.field("Occupancy") },
        { field: resampledStore.field("Speed") },
    ],
    
    //ftrSpace: ftrSpace, //TODO: Later this will be done automatically
    
    target: resampledStore.field("NumOfCars"),
    
    otherParams: {
 // This are optional parameters
        evaluationOffset: 10, // It was 50 before
    },
    
    predictionHorizons: [1, 3, 6, 9, 12, 15, 18],
    //predictionHorizons: horizons,
    
    //recLinRegParameters: { "dim": ftrSpace.dim, "forgetFact": 1, "regFact": 10000 }, // Not used yet. //Have to think about it how to use this
    errorMetrics: [
        { name: "MAE", constructor: function () { return evaluation.newMeanAbsoluteError() } },
        { name: "RMSE", constructor: function () { return evaluation.newRootMeanSquareError() } },
        { name: "MAPE", constructor: function () { return evaluation.newMeanAbsolutePercentageError() } },
        { name: "R2", constructor: function () { return evaluation.newRSquareScore() } }
    ]
}


//var mobisModel = Utils.Model.newModel(modelConf);



///////////////////// LOADING DATA: SIMULATING DATA FLOW /////////////////////
// Load stores
qm.load.jsonFile(base.store("CounterNode"), "./sandbox/countersNodes.txt");
//qm.load.jsonFile(base.store('trafficLoadStore'), "./sandbox/measurements_0011_11.txt");
qm.load.jsonFileLimit(base.store('trafficLoadStore'), "./sandbox/measurements_0011_11.txt",1000);

// Simultaing data flow (later this shuld be replaced by imputor)
Utils.Data.importData([trafficLoadStore], [trafficStore], 10000);


console.log(trafficStore.recs.length); // DEBUGING
console.log("Max speed:" + resampledStore.last.measuredBy.MaxSpeed); //DEBUGING

console.log(base.getStoreList().map(function (store) { return store.storeName}))

///////////////////// REST SERVER /////////////////////
// Start the server
//server.start();
