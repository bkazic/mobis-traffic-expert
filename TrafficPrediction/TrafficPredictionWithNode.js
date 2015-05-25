// Import modules
var qm = require('qminer');
var path = require('path');
var server = require('./server.js');
var evaluation = require('./my_modules/utils/online-evaluation/evaluation.js')

// Import my modules
Utils = {};
Utils.Data = require('./my_modules/utils/importData.js');
Utils.SpecialDates = require('./my_modules/utils/special-dates/special-dates.js')
Utils.Helper = require('./my_modules/utils/helper.js')
Model = require('./my_modules/utils/mobis-model/model.js')

//// Define stores
qm.delLock();
//qm.config('qm.conf', true, 8080, 1024);
var base = qm.create('qm.conf', 'sensors.def', true); // How can I spec dbPath??

// TODO: Why cant I use schema with this constructor?
//qm.delLock();
//var base = new qm.Base({
//    mode: 'createClean', 
//    schemaPath: 'sensors.def',
//    dbPath: path.join(__dirname, './db')
//})

var CounterNode = base.store("CounterNode");
var Evaluation = base.store("Evaluation");
var Predictions = base.store("Predictions");
var trafficLoadStore = base.store('trafficLoadStore');
var trafficStore = base.store('trafficStore');
//var mergedStore = base.store('mergedStore'); 
var resampledStore = base.store('resampledStore');



// This is used by feature extractor, and updated from MobisModel
var avrVal = Utils.Helper.newDummyModel();

////////////////////////////// DEFINING FEATURE SPACE //////////////////////////////
var modelConf = {
    base: base,
    locAvr: avrVal, // Not sure if this is ok, has to be debuged
    stores: {
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
        { type: "jsfunc", source: resampledStore.name, name: "AvrVal", fun: avrVal.getVal },
        //{ type: "jsfunc", source: resampledStore.name, name: "AvrVal", fun: modelConf.locAvr.getVal },
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


var mobisModel = new Model(modelConf);


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
// Load stores
qm.load.jsonFile(base.store("CounterNode"), "./sandbox/countersNodes.txt");
qm.load.jsonFile(base.store('trafficLoadStore'), "./sandbox/measurements_0011_11.txt");
//qm.load.jsonFileLimit(base.store('trafficLoadStore'), "./sandbox/measurements_0011_11.txt",1000);

// Simultaing data flow (later this shuld be replaced by imputor)
//Utils.Data.importData([trafficLoadStore], [trafficStore]);
Utils.Data.importData([trafficLoadStore], [trafficStore], 10000);


console.log(trafficStore.recs.length); // DEBUGING
console.log("Max speed:" + resampledStore.last.measuredBy.MaxSpeed); //DEBUGING

console.log(base.getStoreList().map(function (store) { return store.storeName}))

///////////////////// REST SERVER /////////////////////
// Start the server
server.start();
