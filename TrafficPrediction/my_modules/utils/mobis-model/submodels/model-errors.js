var qm = require('qminer');
var logger = require("../../logger/logger.js");
var path = require('path');

createErrorModels = function (fields, horizons, errMetrics) {
    var errorModels = [];
    for (var field in fields) {
        errorModels[field] = [];
        errorModels[field]["Model"] = { "field": fields[field].field.name };
        for (var horizon in horizons) {
            errorModels[field][horizon] = [];
            errorModels[field][horizon]["Model"] = { "horizon": horizons[horizon] };
            for (var errMetric in errMetrics) {
                errorModels[field][horizon][errMetric] = errMetrics[errMetric].constructor();
                errorModels[field][horizon][errMetric]["MetricName"] = errMetrics[errMetric].name;
                errorModels[field][horizon][errMetric]["PredictionField"] = fields[field].field.name;
            };
        };
    };
    return errorModels;
};


// save buffer state
saveState = function (errorModels, fields, horizons, errMetrics, dirName) {
    // check if dirName exists, if not, create it
    if (!qm.fs.exists(dirName)) qm.fs.mkdir(dirName);
    // open file in write mode
    var fout = new qm.fs.FOut(path.join(dirName, "errors_model")); 
    // write all states to fout
    for (var fieldIdx in fields) { 
        for (var horizonIdx in horizons) {
            for (var errorMetricIdx in errMetrics) {
                var errorModel = errorModels[fieldIdx][horizonIdx][errorMetricIdx];
                errorModel.save(fout);
            }
        }
    }
    fout.flush();
    fout.close();
    logger.info('Saved error model states')
};

// load buffer state
loadState = function (errorModels, fields, horizons, errMetrics, dirName) {
    // open file in read mode
    var fin = new qm.fs.FIn(path.join(dirName, "errors_model"));
    // write all states to fout
    for (var fieldIdx in fields) {
        for (var horizonIdx in horizons) {
            for (var errorMetricIdx in errMetrics) {
                var errorModel = errorModels[fieldIdx][horizonIdx][errorMetricIdx];
                errorModel.load(fin);
            }
        }
    }
    fin.close();
    logger.info('Loaded error model states')
};

exports.create = createErrorModels;
exports.save = saveState;
exports.load = loadState;