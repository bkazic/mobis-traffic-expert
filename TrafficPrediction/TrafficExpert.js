// Import modules
var qm = require('qminer');
var path = require('path');
var evaluation = qm.analytics.metrics;
var logger = require("./my_modules/utils/logger/logger.js");
var env = process.env.NODE_ENV || 'development';
var config = require('./config.json')[env];

// Import my modules
Utils = {};
InfoTrip = {}
Utils.Data = require('./my_modules/utils/importData.js');
Utils.SpecialDates = require('./my_modules/utils/special-dates/special-dates.js')
Utils.Helper = require('./my_modules/utils/helper.js');
Utils.DefineStores = require('./my_modules/utils/define-stores/sensor-stores.js')
Model = require('./my_modules/utils/mobis-model/model.js');
var InfoTripAPI = require('./InfoTrip/services.js')
InfoTrip.Services = new InfoTripAPI();
//InfoTrip.Services = new require('./InfoTrip/services.js')();
InfoTrip.Adapters = require('./InfoTrip/adapter.js');

var TrafficExpert = function () {
    this.base;
    this.mobisModels = {};
    this.sensorIds;
    this.stores;
    this.pathDb = path.join(__dirname, './db');
    this.pathBackup = path.join(__dirname, './backup')
}

TrafficExpert.prototype.init = function (base) {
    this.initStores(base);
    this.initModels();
    this.initAggregates();
}

TrafficExpert.prototype.initStores = function (base) {
    //////// INIT STORES ////////
    this.base = base;

    // create schema if not in open or openReadOnly' mode
    var sensorsStore = Utils.DefineStores.createSensorsStore(base);
    this.stores = Utils.DefineStores.createMeasurementStores(base);
    
    // sensor ids
    this.sensorIds = sensorsStore.map(function (sensor) { return sensor.pathId.toString() })
    
    // shutdown properly when service is closed
    process.on('SIGINT', function () { this.shutdown(); this.backup(); process.exit(); }.bind(this));
    process.on('SIGHUP', function () { this.shutdown(); this.backup(); process.exit(); }.bind(this));
    process.on('uncaughtException', function () { this.shutdown(); this.backup(); process.exit(); }.bind(this));
}


TrafficExpert.prototype.initModels = function () {
    //////// INIT MOBIS MODELS ////////
    // This is used by feature extractor, and updated from MobisModel
    var avrVal = Utils.Helper.newDummyModel();
    
    this.sensorIds.forEach(function (sensorId) {
        
        // Prepare store references
        var rawStore = this.stores.rawStores[sensorId]
        var resampledStore = this.stores.resampledStores[sensorId]
        var predictionStore = this.stores.predictionStores[sensorId]
        var evaluationStore = this.stores.evaluationStores[sensorId]
       
        // Define model configurations
        var modelConf = {
            base : this.base,
            sensorId: sensorId,
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
                evaluationOffset: 10, // It was 50 before
            },
            
            predictionHorizons: [1],
            //predictionHorizons: horizons,
            
            //recLinRegParameters: { "dim": ftrSpace.dim, "forgetFact": 1, "regFact": 10000 }, // Not used yet. //Have to think about it how to use this
            errorMetrics: [
                { name: "MAE", constructor: function () { return new evaluation.MeanAbsoluteError() } },
                { name: "RMSE", constructor: function () { return new evaluation.RootMeanSquareError() } },
                { name: "MAPE", constructor: function () { return new evaluation.MeanAbsolutePercentageError() } },
                { name: "R2", constructor: function () { return new evaluation.R2Score() } }
            ]
        }
        
        console.log() // just to create new line in console
        logger.info("[MobiS Model] Initializing MobiS model for sensor: " + sensorId);
        logger.info("[MobiS Model] SourceStore: " + modelConf.stores.sourceStore.name);
        logger.info("[MobiS Model] PredictionStore: " + modelConf.stores.predictionStore.name);
        logger.info("[MobiS Model] EvaluationStore: " + modelConf.stores.evaluationStore.name);
        
        // Create model instance for specific sensor
        var mobisModel = new Model(modelConf);
        mobisModel["sourceStore"] = modelConf.stores.sourceStore;
        mobisModel["predictionStore"] = modelConf.stores.predictionStore;
        mobisModel["evaluationStore"] = modelConf.stores.evaluationStore;
        
        this.mobisModels[sensorId] = mobisModel;
    }, this);
}

TrafficExpert.prototype.initAggregates = function () {
    //////// INIT STREAM AGGREGATES ////////
    this.sensorIds.forEach(function (sensorId) {
        
        console.log()
        logger.info("[Stream Aggregate] Adding Stream Aggregates for sensor: " + sensorId);
        
        // Prepare store references
        var rawStore = this.stores.rawStores[sensorId]
        var resampledStore = this.stores.resampledStores[sensorId]
        var predictionStore = this.stores.predictionStores[sensorId]
        var evaluationStore = this.stores.evaluationStores[sensorId]
        
        // model
        var model = this.mobisModels[sensorId];
        
        //////// PREPROCESSING ////////
        // Todo
        
        
        //////// RESAMPLER ////////
        logger.info("[Stream Aggregate] adding Resampler");

        var resampleInterval = 60 * 60 * 1000;
        model['resampler'] = rawStore.addStreamAggr({
            name: "resampler", type: "resampler",
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
        
        //////// ANALYTICS ////////
        logger.info("[Stream Aggregate] adding Analytics");
        
        resampledStore.addStreamAggr({
            name: "analytics",
            onAdd: function (rec) {
                var id = rec.Sensor.pathId
                var mobisModel = this.mobisModels[id];
                
                // analytics pipeline
                mobisModel.predict(rec);
                //mobisModel.update(rec);
                //mobisModel.evaluate(rec);
                //mobisModel.consoleReport(rec);
                
                // do not update if count=0 (means that data are set to average)
                if (rawStore.last.Count != 0) {
                    // do not update if the gap between last record and resampled record is bigger than 2 hours
                    var lastId = (rawStore.length > 2) ? rawStore.length - 2 : 0
                    if (rec.DateTime - rawStore[lastId].DateTime <= 2 * 60 * 60 * 1000) {
                        mobisModel.update(rec);
                        mobisModel.evaluate(rec);
                    }
                    
                    // report to console only if we are in development env
                    if (env === 'development') mobisModel.consoleReport(rec);
                }

            }.bind(this),
            saveJson: function () { return {} }
        });
        
        //////// SEND LATEST PREDICTION ////////
        logger.info("[Stream Aggregate] adding triger to prdictions\n");
        resampledStore.addStreamAggr({
            name: "predictions",
            onAdd: function (rec) {
                // check if prediction is actual, if not, exit from function
                if (rec.Predictions[0].PredictionTime < new Date()) return;
                // transform rec to InfoTrip format
                
                // TODO:
                // poslji napovedi samo ce si dobil last.Count != 0, drugace poslji free flow
                // mogoce lahko to nardis v naslednji funkciji?
                
                var transformedRec = InfoTrip.Adapters.transform(rec);
                // send data if env is 'production', or simulate if else
                if (env === 'production') {
                    logger.debug("\x1b[32mSending record: " + JSON.stringify(transformedRec, null, 2) + "\x1b[0m");
                    InfoTrip.Services.updatePathData(transformedRec, function (err, resp, body) {
                        if (err) throw err;
                    });
                } else {
                    logger.info("\x1b[32m[InfoTrip] Simulating sending prediction: " + 
                        JSON.stringify(transformedRec, null, 2) + "\x1b[0m")
                }
            },
            saveJson: function () { return {} }
        });

    }, this);
}


// load each model aggregate
TrafficExpert.prototype.saveState = function (path) {
    var path = (typeof path === 'undefined') ? this.pathDb : path
    for (var sensorId in this.mobisModels) {
        if (this.mobisModels.hasOwnProperty(sensorId)) {
            var model = this.mobisModels[sensorId];
            logger.info("\nSaving model states for sensor " + sensorId);
            model.save(path);
        }
    }
}

// load each model aggregate
TrafficExpert.prototype.loadState = function (path) {
    var path = (typeof path === 'undefined') ? this.pathDb : path
    for (var sensorId in this.mobisModels) {
        if (this.mobisModels.hasOwnProperty(sensorId)) {
            var model = this.mobisModels[sensorId];
            logger.info("\nLoading model states for sensor " + sensorId);
            model.load(path);
        }
    }
}

TrafficExpert.prototype.shutdown = function () {
    // debugging purpuses - delete it later
    logger.debug(JSON.stringify(this.mobisModels['1'].locAvrgs, false, 2))
    logger.debug(JSON.stringify(this.mobisModels['1'].linregs, false, 2))
    logger.debug(JSON.stringify(this.mobisModels['1'].recordBuffers, false, 2))
    logger.debug(JSON.stringify(this.mobisModels['1'].errorModels, false, 2))
    
    if (!this.base.isClosed()) {
        logger.info("Shutting down...");
        this.saveState();
        this.base.close();
        logger.info("Model state is saved. Base is closed.");
    } else {
        logger.debug("Base allready closed.")
    }
}

TrafficExpert.prototype.backup = function (reopen) {
    logger.info("Creating backup...");
    
    // if true, reopen and relode state after backup
    var reopen = (typeof reopen === 'undefined') ? false : reopen;
    
    // shutdown first (close and save) before backuping
    if (!this.base.isClosed()) this.shutdown();
    
    // copy .db to .backup
    Utils.Helper.copyFolder(this.pathDb, this.pathBackup);
    logger.info("Backup created.");
    
    //  if reopen flag is true - reopen and load from created backup
    if (reopen) {
        logger.info("Reopening model...");
        // reopen saved base
        var newBase = new qm.Base({
            mode: 'open',
            dbPath: this.pathDb
            //dbPath: this.pathBackup // backup is not saved properly
        })
        newBase["mode"] = 'open';
        
        // load saved state
        this.init(newBase);
        debugger;
        this.loadState(this.pathDb); 
        //this.loadState(this.pathBackup); // this should load from pathBackup
        console.log();
        logger.info("Model reopened.");
    }
}

///////////////////// EXPORTS /////////////////////
module.exports = TrafficExpert;

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