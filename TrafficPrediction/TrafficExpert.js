// Import modules
var qm = require('qminer');
var path = require('path');
var server = require('./server/server.js');
var evaluation = require('./my_modules/utils/online-evaluation/evaluation.js')

// Import my modules
Utils = {};
Utils.Data = require('./my_modules/utils/importData.js');
Utils.SpecialDates = require('./my_modules/utils/special-dates/special-dates.js')
Utils.Helper = require('./my_modules/utils/helper.js');
Model = require('./my_modules/utils/mobis-model/model.js');

//// Define stores
// create base for the store
var base = qm.create('qm.conf', 'store.def', true); 
//This is to verbose
//var base = new qm.Base({
//    mode: 'createClean', 
//    //schemaPath: path.join(__dirname, './store.def'), // its more robust but, doesen't work from the console
//    schemaPath: './store.def',
//    //dbPath: path.join(__dirname, './db')
//    dbPath: './db'
//})


var rawStore = base.store("rawStore");
var resampledStore = base.store("resampledStore");
var predictionStore = base.store("predictionStore");
var evaluationStore = base.store("evaluationStore");

// This is used by feature extractor, and updated from MobisModel
var avrVal = Utils.Helper.newDummyModel();

////////////////////////////// DEFINING FEATURE SPACE //////////////////////////////
var modelConf = {
    base: base,
    locAvr: avrVal, // Not sure if this is ok, has to be debuged
    stores: {
        "sourceStore": resampledStore,
        "predictionStore": predictionStore,
        "evaluationStore": evaluationStore,
    },
    fields: [ // From this, feature space could be build.
        { name: "TravelTime" },
        { name: "AverageSpeed" }
    ],
    
    featureSpace: [
        { type: "constant", source: resampledStore.name, val: 1 },
        //{ type: "numeric", source: store.name, field: "Ema1", normalize: false },
        //{ type: "numeric", source: store.name, field: "Ema2", normalize: false },
        { type: "numeric", source: resampledStore.name, field: "TravelTime", normalize: false },
        { type: "numeric", source: resampledStore.name, field: "AverageSpeed", normalize: false },
        { type: "jsfunc", source: resampledStore.name, name: "AvrVal", fun: avrVal.getVal },
    ],
    
    predictionFields: [ //TODO: Not sure, if I want to use names of fields or fields??
        { field: resampledStore.field("TravelTime") },
        { field: resampledStore.field("AverageSpeed") }
    ],
        
    target: resampledStore.field("TravelTime"),
    
    otherParams: {
        // This are optional parameters
        evaluationOffset: 50, // It was 50 before
    },
    
    predictionHorizons: [1],
    
    //recLinRegParameters: { "dim": ftrSpace.dim, "forgetFact": 1, "regFact": 10000 }, // Not used yet. //Have to think about it how to use this
    errorMetrics: [
        { name: "MAE", constructor: function () { return evaluation.newMeanAbsoluteError() } },
        { name: "RMSE", constructor: function () { return evaluation.newRootMeanSquareError() } },
        { name: "MAPE", constructor: function () { return evaluation.newMeanAbsolutePercentageError() } },
        { name: "R2", constructor: function () { return evaluation.newRSquareScore() } }
    ]
}

// create recursive linear regression model
var mobisModel = new Model(modelConf);


//////////////////////////// RESAMPLING MERGED STORE ////////////////////////////
// This resample aggregator creates new resampled store
var resampleInterval = 60 * 60 * 1000;
rawStore.addStreamAggr({
    name: "Resampled", type: "resampler",
    outStore: resampledStore.name, timestamp: "DateTime",
    fields: [{ name: "TravelTime", interpolator: "previous" },
             { name: "AverageSpeed", interpolator: "previous" },
             { name: "Origin", interpolator: "previous" }
    ],
    createStore: false, interval: resampleInterval
});


//////////////////////////// PREDICTION AND EVALUATION ////////////////////////////
resampledStore.addStreamAggr({
    name: "analytics",
    onAdd: function (rec) {
        
        mobisModel.predict(rec);
        
        mobisModel.update(rec);
        
        mobisModel.evaluate(rec);
        
        mobisModel.consoleReport(rec);

    },
    saveJson: function () { return {} }
});



///////////////////// LOADING DATA: SIMULATING DATA FLOW /////////////////////
// load rawStore from file
qm.load.jsonFile(rawStore, "./sandbox/data.json");

console.log(rawStore.recs.length); // DEBUGING
console.log(resampledStore.recs.length); // DEBUGING

console.log(base.getStoreList().map(function (store) { return store.storeName}))

///////////////////// REST SERVER /////////////////////
// Start the server
server.init(base);
server.start();
