// Import modules
var qm = require('qminer');
var path = require('path');
var evaluation = require('./my_modules/utils/online-evaluation/evaluation.js') // Delete this later
var logger = require("./my_modules/utils/logger/logger.js");
var InfoTrip = require('./InfoTrip/services.js')
var env = process.env.NODE_ENV || 'development';
var config = require('./config.json')[env];

// Import my modules
Utils = {};
Utils.Data = require('./my_modules/utils/importData.js');
Utils.SpecialDates = require('./my_modules/utils/special-dates/special-dates.js')
Utils.Helper = require('./my_modules/utils/helper.js');
Utils.DefineStores = require('./my_modules/utils/define-stores/sensor-stores.js')
Model = require('./my_modules/utils/mobis-model/model.js');

// Exports initialisation function
exports.init = function (base) {
    
    //////// INIT STORES ////////
    var sensorsStore = Utils.DefineStores.createSensorsStore(base);
    var measurementStores = Utils.DefineStores.createMeasurementStores(base);
    

    //////// INIT MOBIS MODELS ////////
    // This is used by feature extractor, and updated from MobisModel
    var avrVal = Utils.Helper.newDummyModel();
    var mobisModels = {};

    sensorsStore.each(function (sensor) {
        
        // Prepare store references
        var rawStore = measurementStores.rawStores[sensor.pathId]
        var resampledStore = measurementStores.resampledStores[sensor.pathId]
        var predictionStore = measurementStores.predictionStores[sensor.pathId]
        var evaluationStore = measurementStores.evaluationStores[sensor.pathId]
        
        // Define model configurations
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

        logger.info("[MobiS Model] Initializing MobiS model for sensor: " + sensor.pathId);
        logger.info("[MobiS Model] SourceStore: " + modelConf.stores.sourceStore.name);
        logger.info("[MobiS Model] PredictionStore: " + modelConf.stores.predictionStore.name);
        logger.info("[MobiS Model] EvaluationStore: " + modelConf.stores.evaluationStore.name + "\n");
        
        // Create model instance for specific sensor
        var mobisModel = new Model(modelConf);
        mobisModel["sourceStore"] = modelConf.stores.sourceStore;
        mobisModel["predictionStore"] = modelConf.stores.predictionStore;
        mobisModel["evaluationStore"] = modelConf.stores.evaluationStore;
        
        mobisModels[sensor.pathId] = mobisModel;
    });
    
    //////// INIT STREAM AGGREGATES ////////
    sensorsStore.each(function (sensor) {
        logger.info("[Stream Aggregate] Adding Stream Aggregates for sensor: " + sensor.pathId);

        // Prepare store references
        var rawStore = measurementStores.rawStores[sensor.pathId]
        var resampledStore = measurementStores.resampledStores[sensor.pathId]
        var predictionStore = measurementStores.predictionStores[sensor.pathId]
        var evaluationStore = measurementStores.evaluationStores[sensor.pathId]

        //////// RESAMPLER ////////
        logger.info("[Stream Aggregate] adding Resampler");
        // This resample aggregator creates new resampled store
        var resampleInterval = 60 * 60 * 1000;
        rawStore.addStreamAggr({
            name: "Resampled", type: "resampler",
            outStore: resampledStore.name, timestamp: "DateTime",
            fields: [{ name: "TravelTime", interpolator: "previous" },
                 { name: "AverageSpeed", interpolator: "previous" }
            ],
            createStore: false, interval: resampleInterval
        });
        
        //////// ADD JOINS BACK ////////
        logger.info("[Stream Aggregate] adding addJoinsBack");
        // Ads a join back, since it was lost with resampler
        resampledStore.addStreamAggr({
            name: "addJoinsBack",
            onAdd: function (rec) {
                rec.$addJoin("Sensor", rawStore.last.Sensor)
            },
            saveJson: function () { return {} }
        })

        //////// PREDICTION AND EVALUATION ////////
        logger.info("[Stream Aggregate] adding Analytics");
        resampledStore.addStreamAggr({
            name: "analytics",
            onAdd: function (rec) {
                var mobisModel = mobisModels[rec.Sensor.pathId];
                
                // analytics pipeline
                mobisModel.predict(rec);
                mobisModel.update(rec);
                mobisModel.evaluate(rec);
                //mobisModel.consoleReport(rec);
            },
            saveJson: function () { return {} }
        });

        //////// SEND LATEST PREDICTION ////////
        logger.info("[Stream Aggregate] adding triger to prdictions\n");
        predictionStore.addStreamAggr({
            name: "predictions",
            onAdd: function (rec) {
            // TODO: send prediction to InfoTrip server
            // Example: InfoTrip.updatePathData(rec, callback)
           // InfoTrip.updatePathData(rec)
            },
            saveJson: function () { return {} }
        })
    });
    
    
    ///// OLD CODE ///

    //var rawStore = base.store("rawStore");
    //var resampledStore = base.store("resampledStore");
    //var predictionStore = base.store("predictionStore");
    //var evaluationStore = base.store("evaluationStore");
    
    //// This is used by feature extractor, and updated from MobisModel
    //var avrVal = Utils.Helper.newDummyModel();
    
    //////////////////////////////// DEFINING FEATURE SPACE //////////////////////////////
    //var modelConf = {
    //    base: base,
    //    locAvr: avrVal, // Not sure if this is ok, has to be debuged
    //    stores: {
    //        "sourceStore": resampledStore,
    //        "predictionStore": predictionStore,
    //        "evaluationStore": evaluationStore,
    //    },
    //    fields: [ // From this, feature space could be build.
    //        { name: "TravelTime" },
    //        { name: "AverageSpeed" }
    //    ],
        
    //    featureSpace: [
    //        { type: "constant", source: resampledStore.name, val: 1 },
    //        //{ type: "numeric", source: store.name, field: "Ema1", normalize: false },
    //        //{ type: "numeric", source: store.name, field: "Ema2", normalize: false },
    //        { type: "numeric", source: resampledStore.name, field: "TravelTime", normalize: false },
    //        { type: "numeric", source: resampledStore.name, field: "AverageSpeed", normalize: false },
    //        { type: "jsfunc", source: resampledStore.name, name: "AvrVal", fun: avrVal.getVal },
    //    ],
        
    //    predictionFields: [ //TODO: Not sure, if I want to use names of fields or fields??
    //        { field: resampledStore.field("TravelTime") },
    //        { field: resampledStore.field("AverageSpeed") }
    //    ],
        
    //    target: resampledStore.field("TravelTime"),
        
    //    otherParams: {
    //        // This are optional parameters
    //        evaluationOffset: 50, // It was 50 before
    //    },
        
    //    predictionHorizons: [1],
        
    //    //recLinRegParameters: { "dim": ftrSpace.dim, "forgetFact": 1, "regFact": 10000 }, // Not used yet. //Have to think about it how to use this
    //    errorMetrics: [
    //        { name: "MAE", constructor: function () { return evaluation.newMeanAbsoluteError() } },
    //        { name: "RMSE", constructor: function () { return evaluation.newRootMeanSquareError() } },
    //        { name: "MAPE", constructor: function () { return evaluation.newMeanAbsolutePercentageError() } },
    //        { name: "R2", constructor: function () { return evaluation.newRSquareScore() } }
    //    ]
    //}
    
    //// create recursive linear regression model
    //var mobisModel = new Model(modelConf);
    
    
    ////////////////////////////// RESAMPLING MERGED STORE ////////////////////////////
    //logger.info("[Stream Aggregate] adding Resampler");
    //// This resample aggregator creates new resampled store
    //var resampleInterval = 60 * 60 * 1000;
    //rawStore.addStreamAggr({
    //    name: "Resampled", type: "resampler",
    //    outStore: resampledStore.name, timestamp: "DateTime",
    //    fields: [{ name: "TravelTime", interpolator: "previous" },
    //             { name: "AverageSpeed", interpolator: "previous" }
    //    ],
    //    createStore: false, interval: resampleInterval
    //});
    
    ////////// ADD JOINS BACK ////////
    //logger.info("[Stream Aggregate] adding addJoinsBack");
    //// Ads a join back, since it was lost with resampler
    //resampledStore.addStreamAggr({
    //    name: "addJoinsBack",
    //    onAdd: function (rec) {
    //        rec.$addJoin("Sensor", rawStore.last.Sensor)
    //    },
    //    saveJson: function () { return {} }
    //})
    
    ////////////////////////////// PREDICTION AND EVALUATION ////////////////////////////
    //logger.info("[Stream Aggregate] adding Analytics");
    //resampledStore.addStreamAggr({
    //    name: "analytics",
    //    onAdd: function (rec) {
    //        // analytics pipeline
    //        mobisModel.predict(rec);
    //        mobisModel.update(rec);
    //        mobisModel.evaluate(rec);
    //        //mobisModel.consoleReport(rec);
    //    },
    //    saveJson: function () { return {} }
    //});
    
    
    ////////////////////////////// SEND LATEST PREDICTION ////////////////////////////
    //predictionStore.addStreamAggr({
    //    name: "predictions",
    //    onAdd: function (rec) {
    //        // TODO: send prediction to InfoTrip server
    //        // Example: InfoTrip.updatePathData(rec, callback)
    //       // InfoTrip.updatePathData(rec)
    //    },
    //    saveJson: function () { return {} }
    //})
    
    //// console.log("\nPipeline initialized...\n");
    //// TODO also use logger
    
}

///////////////////// LOADING DATA: SIMULATING DATA FLOW /////////////////////
// load rawStore from file

//qm.load.jsonFile(rawStore, "./sandbox/data.json");
//qm.load.jsonFileLimit(rawStore, "./sandbox/data.json", 100);

//console.log(rawStore.length); // DEBUGING
//console.log(resampledStore.length); // DEBUGING

//console.log(base.getStoreList().map(function (store) { return store.storeName}))

///////////////////// REST SERVER /////////////////////
// Ways to start service:
// --> "node TrafficExpert.js" - starts the script
// --> "set NODE_ENV=development&& node TrafficExpert.js" - starts the script in development mode
// --> "set NODE_ENV=preoduction&& node TrafficExpert.js" - starts the script in production mode
// --> "npm start" - starts the script wiht NODE_ENV defined in package.json 