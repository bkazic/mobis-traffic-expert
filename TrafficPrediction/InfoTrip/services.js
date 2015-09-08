var request = require('request');
var logger = require("../my_modules/utils/logger/logger.js");


function test() { 
    // TODO
}


function updatePathData(rec) { 
    // TODO
    logger.info("Sending data: " + JSON.stringify(rec)); console.log()
}

exports.test = test;
exports.updatePathData = updatePathData;
