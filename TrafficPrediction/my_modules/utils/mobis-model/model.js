//Imports
var qm = require('qminer');
var logger = require("../logger/logger.js");
var path = require('path');

SpecialDates = require('../special-dates/special-dates.js')
LocalizedAverage = require('../baseline-models/localized-average.js')

var analytics = qm.analytics;
var specialDates = new SpecialDates.newSpecialDates('Greek_holidays');
var CalendarFtrs = SpecialDates.newCalendarFeatures();

var modelBuffers = require('./submodels/model-buffers.js');
var modelErrors = require('./submodels/model-errors.js');
var modelAverages = require('./submodels/model-averages.js');
var modelLinRegs = require('./submodels/model-linregs.js');

///////////////////////////////// 
// LOCALIZED LINEAR REGRESSION //
///////////////////////////////// 

//function Model(modelConf) {
var Model = function (modelConf) {
    this.modelConf = modelConf;
    this.base = modelConf.base;
    this.sensorId = modelConf.sensorId;
    this.avrVal = modelConf.locAvr;
    this.horizons = (modelConf.predictionHorizons == null) ? 1 : modelConf.predictionHorizons;
    //this.featureSpace = modelConf.featureSpace; // TODO: what to do if it is not defined (if it is null) ?????
    this.featureSpace = new qm.FeatureSpace(this.base, modelConf.featureSpace);
    this.store = modelConf.stores.sourceStore;
    this.predictionStore = modelConf.stores.predictionStore;
    this.evaluationStore = modelConf.stores.evaluationStore;
    this.target = modelConf.target.name;
    this.predictionFields = modelConf.predictionFields;
    this.targets = this.predictionFields.map(function (target) { return target.field.name })
    this.evalOffset = (modelConf.otherParams.evaluationOffset == null) ? 50 : modelConf.otherParams.evaluationOffset;
    this.errorMetrics = modelConf.errorMetrics;
    
    this.recordBuffers = modelBuffers.create(this.horizons, this.store);
    this.locAvrgs = modelAverages.create(this.predictionFields);
    this.linregs = modelLinRegs.create(this.predictionFields, this.horizons, this.featureSpace)
    this.errorModels = modelErrors.create(this.predictionFields, this.horizons, this.errorMetrics)
    this.resampler;
}

Model.prototype.update = function (rec) {
    
    for (var predictionFieldIdx in this.predictionFields) {
        // Update localized average with new record
        var locAvrg = this.locAvrgs[predictionFieldIdx];
        locAvrg.update(rec);
        
        for (var horizonIdx in this.horizons) {
            // Get rec for training
            //var trainRecId = rec.$store.getStreamAggr(this.recordBuffers[horizonIdx].name).val.oldest.$id;
            var trainRecId = this.recordBuffers[this.horizons[horizonIdx]].val.oldest.$id;
            // New: var trainRecId = this.recordBuffers.buffers[horizonIdx].val.odlest.$id;
            
            if (trainRecId > 0) {
                
                var trainRec = this.store[trainRecId];
                var trainHour = trainRec.DateTime.getUTCHours();
                var trainWork = CalendarFtrs.isWorkingDay(trainRec);
                
                var predictionFieldName = this.predictionFields[predictionFieldIdx].field.name;
                var targetVal = rec[predictionFieldName];
                //trainRec.Predictions[horizonIdx].Target = targetVal; //TODO: Make a join!!!!!
                
                try {
                    trainRec.Predictions[horizonIdx].$addJoin("Target", rec);
                } catch (err) {
                    throw new Error(err + ". Use model.predict(rec) first!")
                    logger.error(err.stack);
                }
                
                // Select correct linregs model to update
                var linreg = this.linregs[predictionFieldIdx][horizonIdx][trainWork][trainHour];
                
                // Update models
                this.avrVal.setVal(locAvrg.getVal(rec)) // Set avrVal that is used by ftrExtractor (avrVal.getVal())
                linreg.partialFit(this.featureSpace.extractVector(trainRec), targetVal);
                linreg.updateCount++;

            }
        }
    }
}

Model.prototype.predict = function (rec) {
    
    var predictionRecs = [];
    
    for (var horizonIdx in this.horizons) {
        // Get rec for training
        //var trainRecId = rec.$store.getStreamAggr(this.recordBuffers[horizonIdx].name).val.oldest.$id;
        var trainRecId = this.recordBuffers[this.horizons[horizonIdx]].val.oldest.$id;
        
        // Get prediction interval and time
        var predInter = Math.abs(rec.DateTime - rec.$store[trainRecId].DateTime);
        var predTime = new Date(rec.DateTime.getTime() + predInter);
        
        // Select correct linregs model
        var hour = rec.DateTime.getUTCHours();
        var work = CalendarFtrs.isWorkingDay(rec);
        
        // Create prediction record
        var predictionRec = {};
        predictionRec.OriginalTime = rec.DateTime.toISOString(); //predictionRec.OriginalTime = rec.DateTime.string;
        predictionRec.PredictionTime = predTime.toISOString(); //predictionRec.PredictionTime = predTime.string;
        //predictionRec.PredictionHorizon = this.recordBuffers[horizonIdx].horizon - 1;
        predictionRec.PredictionHorizon = this.horizons[horizonIdx];
        predictionRec.UpdateCount = this.linregs[0][horizonIdx][work][hour].updateCount;
        
        for (var predictionFieldIdx in this.predictionFields) {
            var linreg = this.linregs[predictionFieldIdx][horizonIdx][work][hour];
            var locAvrg = this.locAvrgs[predictionFieldIdx];
            var predictionFieldName = this.predictionFields[predictionFieldIdx].field.name;
            
            this.avrVal.setVal(locAvrg.getVal({ "DateTime": predTime }));
            try {
                predictionRec[predictionFieldName] = linreg.predict(this.featureSpace.extractVector(rec));
            } catch (err) {
                throw new Error("Could not make prediction. " + err);
                logger.error(err.stack);
            }
        }
        
        // Add prediction record to predictions array
        predictionRecs.push(predictionRec);
        
        this.predictionStore.push(predictionRec);
        rec.$addJoin("Predictions", this.predictionStore.last);
    };
    return predictionRecs;
}

Model.prototype.evaluate = function (rec) {
    
    if (rec.$id < this.evalOffset) return; // If condition is true, stop function here.
    
    for (var horizonIdx in this.horizons) {
        
        //var trainRecId = rec.$store.getStreamAggr(this.recordBuffers[horizonIdx].name).val.oldest.$id;
        var trainRecId = this.recordBuffers[this.horizons[horizonIdx]].val.oldest.$id;
        var trainRec = rec.$store[trainRecId]
        
        for (var errorMetricIdx in this.errorMetrics) {
            var errRec = {};
            errRec["Name"] = this.errorMetrics[errorMetricIdx].name;
            
            for (var predictionFieldIdx in this.predictionFields) {
                var predictionFieldName = this.predictionFields[predictionFieldIdx].field.name;
                // find correct model and prediction
                var errorModel = this.errorModels[predictionFieldIdx][horizonIdx][errorMetricIdx];
                var prediction = trainRec.Predictions[horizonIdx][predictionFieldName];
                // update model and write to errRec
                errorModel.push(rec[predictionFieldName], prediction);
                errRec[predictionFieldName] = errorModel.getError();
            }
            
            // add errRec to Evaluation sore, and add join to Predictions store which is linked to Original store
            this.evaluationStore.push(errRec);
            trainRec.Predictions[horizonIdx].$addJoin("Evaluation", this.evaluationStore.last);
        }
    }
}

Model.prototype.consoleReport = function (rec) {
    // TODO: use logger instad of console.log
    
    if (rec.$id < this.evalOffset) return; // If condition is true, stop function here.
    
    var store = rec.$store;
    if (store[store.length - 1].DateTime.getDay() !== store[store.length - 2].DateTime.getDay()) {
        console.log("\n=====================================\n=== REC: %s ===\n=====================================",
        rec.DateTime);
    }
    
    
    for (horizonIdx in this.horizons) {
        
        //var trainRecId = rec.$store.getStreamAggr(this.recordBuffers[horizonIdx].name).val.oldest.$id;
        var trainRecId = this.recordBuffers[this.horizons[horizonIdx]].val.oldest.$id;
        var trainRec = rec.$store[trainRecId]
        
        // Only one report per day
        var store = rec.$store;
        var print = store[store.length - 1].DateTime.getDay() !== store[store.length - 2].DateTime.getDay();
        if (!print) return;
        if (store[trainRecId].Predictions[horizonIdx] == null) return;
        if (store[trainRecId].Predictions[horizonIdx].Evaluation[0] == null) return;
        //if (print && resampledStore[trainRecId].Predictions[horizonIdx] !== null && resampledStore[trainRecId].Predictions[horizon].Evaluation[0] !== null) {
        
        // Report current predictions in the console
        console.log("\n=== Predictions ===\n");
        console.log("Predictions for Sensor ID: " + rec.Sensor.pathId);
        console.log("Update count: " + trainRec.Predictions[horizonIdx].UpdateCount + "\n")
        console.log("Working on rec: " + rec.DateTime.toISOString());
        console.log("Prediction from: " + trainRec.Predictions[horizonIdx].OriginalTime.toISOString()); // Same as trainRec.DateTime.string             
        console.log("Prediction horizon: " + trainRec.Predictions[horizonIdx].PredictionHorizon)
        //console.log("Target: " + rec[this.target.name]); 
        //console.log(this.target.name + ": " + trainRec.Predictions[horizonIdx][this.target.name]);
        
        // report predicted values
        console.log("\n--> Predicted values:");
        this.predictionFields.forEach(function (predField) {
            var fieldNm = predField.field.name;
            var predValue = trainRec.Predictions[horizonIdx][fieldNm];
            var trueValue = rec[fieldNm];
            console.log("%s: %s (true: %s)", fieldNm, predValue.toFixed(2), trueValue.toFixed(2));
        });
        
        // Report evaluation metrics in the console
        console.log("\n=== Evaluation ===");
        for (errorMetricIdx in this.errorMetrics) {
            console.log("--" + this.errorMetrics[errorMetricIdx].name + "--");
            this.predictionFields.forEach(function (predField) {
                var predFieldNm = predField.field.name
                var errorValue = trainRec.Predictions[horizonIdx].Evaluation[errorMetricIdx][predFieldNm];
                console.log("\t" + predFieldNm + ": " + errorValue);
            });
        };
        
    }
     
}

Model.prototype.save = function (dirName) {
    // if sensorId is defined create a subdirectory undefined 
    if (typeof this.sensorId !== 'undefined') { dirName = path.join(dirName, this.sensorId) };
    
    modelBuffers.save(this.recordBuffers, dirName);
    modelErrors.save(this.errorModels, this.predictionFields, this.horizons, this.errorMetrics, dirName);
    modelAverages.save(this.locAvrgs, this.predictionFields, dirName);
    modelLinRegs.save(this.linregs, this.predictionFields, this.horizons, dirName);
    
    var fout = new qm.fs.FOut(path.join(dirName, this.resampler.name));
    this.resampler.save(fout);
    fout.flush();
    fout.close();
    logger.info('Saved resampler aggregate')
}

Model.prototype.load = function (dirName) {
    // if sensorId is defined create a subdirectory undefined 
    if (typeof this.sensorId !== 'undefined') { dirName = path.join(dirName, this.sensorId) }    ;
    
    modelBuffers.load(this.recordBuffers, dirName);
    modelErrors.load(this.errorModels, this.predictionFields, this.horizons, this.errorMetrics, dirName);
    modelAverages.load(this.locAvrgs, this.predictionFields, dirName);
    modelLinRegs.load(this.linregs, this.predictionFields, this.horizons, dirName);
    
    var fin = new qm.fs.FIn(path.join(dirName, this.resampler.name));
    this.resampler.load(fin);
    fin.close();
    logger.info('Loaded resampler aggregate')
}

// Exports
module.exports = Model;