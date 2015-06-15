var TrafficRetriever = require('./my_modules/retrievers/TrafficRetriever.js');
var request = require('request');
var config = require('./config-debug.js');
//var config = require('./config-release.js');
var logger = require('./my_modules/logger/logger.js');

var interval = 60 * 1000;
var trafficRetriever = new TrafficRetriever("http://opendata.si/promet/counters/");

var importUrl = config.trafficPredictionService.root + "/traffic-predictions/add";



//// Main process
//trafficRetriever.test(function (err, rec, callback) {
//    if (err) throw err;
//    console.log("Sending record:\n" + JSON.stringify(rec, null, 2));
    
//    var headers = {
//        'Content-Type': 'application/json',
//    }
//    // If you want to test from Simple REST Client, make sure you add in headers: Content-Type: application/json and then Data: {"test": "test"}
//    request.post({url: importUrl, headers: headers, body: JSON.stringify(rec) }, function (err, res, body) {
//        if (err) logger.error(err.stack);
        
//        logger.debug("Response: " + body);
//    });
    
//});



// USING ASYNC MODULE - Doesent work as it should
// Main process
(function startFetching() {
    trafficRetriever.test(function (err, rec, callback) {
        if (err) throw err;
        console.log("Sending record:\n" + JSON.stringify(rec, null, 2));
    
        var headers = {
            'Content-Type': 'application/json',
        }

        // If you want to test from Simple REST Client, make sure you add in headers: Content-Type: application/json and then Data: {"test": "test"}
        request.post({ url: importUrl, headers: headers, body: JSON.stringify(rec) }, function (err, res, body) {
            if (err) logger.error(err.stack);
            
            logger.debug("Response: " + body);
            callback(); // wait for the response from the server before moving on
        });
        //callback();

    });
    setTimeout(startFetching, interval)

})();
    




//// Main process
//(function startFetching() {
    
//    trafficRetriever.fetchData(function (err, data) {
//        if (err) throw err;
//        console.log("Recieved new record: " + data.feed.title);
//    });

//    setTimeout(startFetching, interval)
//})();

