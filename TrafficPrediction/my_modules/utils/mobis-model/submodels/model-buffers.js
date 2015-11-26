var qm = require('qminer');
var logger = require("../../logger/logger.js");
var path = require('path');

createBuffers = function (horizons, store) {
    // Initialize RecordBuffers definiton for all horizons 
    RecordBuffers = {};
    for (var horizon in horizons) {
        var buffer = store.addStreamAggr({
            name: "delay_" + horizons[horizon] + "h",
            type: "recordBuffer",
            size: horizons[horizon] + 1
        });
        buffer.horizon = horizons[horizon];
        RecordBuffers[horizons[horizon]] = buffer;
    };
    return RecordBuffers;
};

// save buffer state
saveState = function (buffers, dirName) {
    // check if dirName exists, if not, create it
    if (!qm.fs.exists(dirName)) qm.fs.mkdir(dirName);
    // open file in write mode
    var fout = new qm.fs.FOut(path.join(dirName, "buffers_model")); 
    // save each buffer aggregate   
    for (var property in buffers) {
        if (buffers.hasOwnProperty(property)) {
            var buffer = buffers[property];
            buffer.save(fout);
        }
    }
    fout.flush();
    fout.close();
    logger.info('Saved buffer model states')
};

// load buffer state
loadState = function (buffers, dirName) {
    // open file in read mode
    var fin = new qm.fs.FIn(path.join(dirName, "buffers_model")); 
    // load each buffer aggregate
    for (var property in buffers) {
        if (buffers.hasOwnProperty(property)) {
            var buffer = buffers[property];
            buffer.load(fin);
        }
    }
    fin.close();
    logger.info('Loaded buffer model states')
};

exports.create = createBuffers;
exports.save = saveState;
exports.load = loadState;