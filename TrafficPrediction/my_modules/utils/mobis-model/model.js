//Imports
var qm = require('qminer');

SpecialDates = require('../special-dates/special-dates.js')
LocalizedAverage = require('../baseline-models/localized-average.js')

var analytics = qm.analytics;
var specialDates = new SpecialDates.newSpecialDates('Slovenian_holidays');
var CalendarFtrs = SpecialDates.newCalendarFeatures();

createBuffers = function (horizons, store) {
    // Initialize RecordBuffers definiton for all horizons 
    RecordBuffers = [];
    for (var horizon in horizons) {
        recordBuffer = {
            name: "delay_" + horizons[horizon] + "h",
            type: "recordBuffer",
            horizon: horizons[horizon] + 1
        };
        RecordBuffers.push(recordBuffer);
    };

    // Execute buffer agregates for all horizons
    for (var horizon in horizons) {
        var RecordBuffer = RecordBuffers[horizon];

        store.addStreamAggr({
            name: RecordBuffer.name, type: RecordBuffer.type, size: RecordBuffer.horizon
        });
    };
    return RecordBuffers;
};

createAvrgModels = function (targetFields) {
    // create set of locAvr models, for every target field
    var avrgs = [];
    targetFields.forEach(function (target, targetIdx) {
        avrgs[targetIdx] = new LocalizedAverage({ fields: target.field });
        avrgs[targetIdx]["predictionField"] = target.field.name;
    })
    return avrgs;
}

createLinRegModels = function (fields, horizons, ftrSpace) {
    // create set of linear regression models 
    var linregs = []; // this will be array of objects
    for (var field in fields) { // models for prediction fields
        linregs[field] = [];
        linregs[field]["Model"] = { "field": fields[field].field.name };
        for (var horizon in horizons) { // models for horizons
            linregs[field][horizon] = [];
            linregs[field][horizon]["Model"] = { "horizon": horizons[horizon] };
            for (var i = 0; i < 2; i++) { // 2 models: working day or not
                linregs[field][horizon][i] = [];
                linregs[field][horizon][i]["Model"] = { "WorkingDay": Boolean(i) }
                for (var j = 0; j < 24; j++) { // 24 models: for every hour in day
                    linregs[field][horizon][i][j] = new analytics.RecLinReg({ "dim": ftrSpace.dim, "forgetFact": 1, "regFact": 10000 });
                    linregs[field][horizon][i][j]["predictionField"] = fields[field].field.name;
                    linregs[field][horizon][i][j]["horizon"] = horizons[horizon];
                    linregs[field][horizon][i][j]["workingDay"] = i; // asign new field "workingDay" to model (just for demonstrational use)
                    linregs[field][horizon][i][j]["forHour"] = j; // asign new field "forHour" to model (just for demonstrational use)
                    linregs[field][horizon][i][j]["updateCount"] = 0; // how many times model was updated (just for demonstrational use)
                }
            }
        }
    }
    return linregs;
};

createErrorModels = function (fields, horizons, errMetrics) {
    var errorModels = [];
    for (var field in fields) {
        errorModels[field] = [];
        for (var horizon in horizons) {
            errorModels[field][horizon] = [];
            for (var errMetric in errMetrics) {
                errorModels[field][horizon][errMetric] = errMetrics[errMetric].constructor();
                errorModels[field][horizon][errMetric]["MetricName"] = errMetrics[errMetric].name;
                errorModels[field][horizon][errMetric]["PredictionField"] = fields[field].field.name;
            };
        };
    }
    return errorModels;
};


///////////////////////////////// 
// LOCALIZED LINEAR REGRESSION //
///////////////////////////////// 

//function Model(modelConf) {
var Model = function (modelConf) {
    
    this.base = modelConf.base;
    this.avrVal = modelConf.locAvr;
    this.horizons = (modelConf.predictionHorizons == null) ? 1 : modelConf.predictionHorizons;
    //this.featureSpace = modelConf.featureSpace; // TODO: what to do if it is not defined (if it is null) ?????
    this.featureSpace = new qm.FeatureSpace(this.base, modelConf.featureSpace);
    this.store = modelConf.stores.sourceStore;
    this.predictionStore = modelConf.stores.predictionStore;
    this.evaluationStore = modelConf.stores.evaluationStore;
    this.target = modelConf.target.name;
    this.predictionFields = modelConf.predictionFields;  
    this.targets = this.predictionFields.map(function (target) { return target.field.name})
    this.evalOffset = (modelConf.otherParams.evaluationOffset == null) ? 50 : modelConf.otherParams.evaluationOffset;
    this.errorMetrics = modelConf.errorMetrics;

    this.recordBuffers = createBuffers(this.horizons, this.store);
    this.locAvrgs = createAvrgModels(this.predictionFields);
    this.linregs = createLinRegModels(this.predictionFields, this.horizons, this.featureSpace)
    this.errorModels = createErrorModels(this.predictionFields, this.horizons, this.errorMetrics);
}

Model.prototype.update = function (rec) {
    
    for (var predictionFieldIdx in this.predictionFields) {
        // Update localized average with new record
        var locAvrg = this.locAvrgs[predictionFieldIdx];
        locAvrg.update(rec);
        
        for (var horizonIdx in this.horizons) {
            // Get rec for training
            //var trainRecId = rec.$store.getStreamAggr(RecordBuffers[horizonIdx].name).val.oldest.$id; //OLD
            var trainRecId = rec.$store.getStreamAggr(RecordBuffers[horizonIdx].name).val.oldest.$id;
            
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
                    console.log(err + ". Use model.predict(rec) first!")
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
        var trainRecId = rec.$store.getStreamAggr(RecordBuffers[horizonIdx].name).val.oldest.$id;
            
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
        predictionRec.PredictionHorizon = RecordBuffers[horizonIdx].horizon - 1;
        predictionRec.UpdateCount = this.linregs[0][horizonIdx][work][hour].updateCount;
            
        for (var predictionFieldIdx in this.predictionFields) {
            var linreg = this.linregs[predictionFieldIdx][horizonIdx][work][hour];
            var locAvrg = this.locAvrgs[predictionFieldIdx];
            var predictionFieldName = this.predictionFields[predictionFieldIdx].field.name;
                
            this.avrVal.setVal(locAvrg.getVal({ "DateTime": predTime }));
            predictionRec[predictionFieldName] = linreg.predict(this.featureSpace.extractVector(rec));
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
            
        var trainRecId = rec.$store.getStreamAggr(RecordBuffers[horizonIdx].name).val.oldest.$id;
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
                errorModel.update(rec[predictionFieldName], prediction);
                errRec[predictionFieldName] = errorModel.getError();
            }
            
            // add errRec to Evaluation sore, and add join to Predictions store which is linked to Original store
            this.evaluationStore.push(errRec);
            trainRec.Predictions[horizonIdx].$addJoin("Evaluation", this.evaluationStore.last);
        }
    }
}

Model.prototype.consoleReport = function (rec) {
    // TODO
    
    if (rec.$id < this.evalOffset) return; // If condition is true, stop function here.
    
    var store = rec.$store;
    if (store[store.length - 1].DateTime.getDay() !== store[store.length - 2].DateTime.getDay()) {
        console.log("\n=====================================\n=== REC: %s ===\n=====================================",
        rec.DateTime);
    }
    
    for (horizonIdx in this.horizons) {
        
        var trainRecId = rec.$store.getStreamAggr(RecordBuffers[horizonIdx].name).val.oldest.$id;
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
        console.log("Predictions for Sensor ID: " + rec.Origin);
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

// Exports
module.exports = Model;
