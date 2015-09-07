var request = require('request');
var logger = require("../my_modules/utils/logger/logger.js");


function test() { 
    // TODO
}


function updatePathData(rec) { 
    // TODO
    logger.debug("\nSending data: " + JSON.stringify(rec));
}

exports.test = test;
exports.updatePathData = updatePathData;
