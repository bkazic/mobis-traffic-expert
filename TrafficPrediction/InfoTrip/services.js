var request = require('request');
var logger = require("../my_modules/utils/logger/logger.js");

// InforTrip API constructor
function InfoTrip() {
    this.baseUrl = "http://tomcat.infotrip.gr/infotrip-wrapper/v1/infotrip";
    this.routes = {
        latestReasoning: this.baseUrl + "/latestReasoning",
        pathData: this.baseUrl + "/pathData",
        deviationData: this.baseUrl + "/deviationData",
        updatePathData: this.baseUrl + "/updatePathData"
    }
}

//Example: http://tomcat.infotrip.gr/infotrip-wrapper/v1/infotrip/deviationData
InfoTrip.prototype.deviationData = function (callback) {
    var url = this.routes["deviationData"];
    //var url = "http://localhost:1338/traffic-predictions"
    
    makeGetRequest(url, function (err, resp, data) {
        if (err) return callback(err);
        return callback(null, resp, data);
    });
}

//Example: http://tomcat.infotrip.gr/infotrip-wrapper/v1/infotrip/latestReasoning
InfoTrip.prototype.latestReasoning = function (callback) {
    var url = this.routes["latestReasoning"];
    //var url = "http://localhost:1338/traffic-predictions/get-sensors"

    makeGetRequest(url, function (err, resp, data) {
        if (err) return callback(err);
        return callback(null, resp, data);
    });
}

//Example: http://tomcat.infotrip.gr/infotrip-wrapper/v1/infotrip/pathData
InfoTrip.prototype.pathData = function (callback) {
    var url = this.routes["pathData"];
    //var url = "http://localhost:1338/get-store-list"
    
    makeGetRequest(url, function (err, resp, data) {
        if (err) return callback(err);
        return callback(null, resp, data);
    });
}

//Example: http://tomcat.infotrip.gr/infotrip-wrapper/v1/infotrip/updatePathData
InfoTrip.prototype.updatePathData = function (data, callback) {
    var url = this.routes["updatePathData"];
    //var url = "http://localhost:1338/traffic-predictions/add"
    
    makePostRequest(url, data, function (err, resp, data) {
        if (err) return callback(err);
        return callback(null, resp, data)
    });
}

// Make GET requests function
function makeGetRequest(url, callback) {
    request(url, function (error, response, body) {
        logger.info("Requesting data at: [GET] " + url);
        if (error) {
            logger.error("Error at making request " + url + " \n" + error.stack);
            return callback(error);
        }
        if (response.statusCode !== 200) {
            var err = new InfoTripApiError("Request faild with status code " + response.statusCode);
            logger.error(err.stack);
            throw err;
        }
        logger.info("Sucessfull request at: " + url);
        return callback(null, response, body);
    });
}

// Make POST requests function
function makePostRequest(url, data, callback) {
    request.post(url, { json: data }, function (error, response, body) {
        logger.info("Send data to InfoTrip: " + JSON.stringify(data) + " at: [POST] " + url)
        if (error) {
            logger.error("Error at making request " + url + " \n" + error.stack);
            return callback(error);
        }
        if (response.statusCode !== 200) {
            var err = new InfoTripApiError("Request faild with status code " + response.statusCode);
            logger.error(err.stack);
            throw err;
        }
        logger.info("Sucessfully posted data: " + JSON.stringify(data));
        logger.info("\x1b[32m[InfoTrip] Response from InfoTrip: " + JSON.stringify(body) + "\x1b[0m");
        return callback(null, response, body)
    })
};

// Custom Error message 
// (ref: http://j-query.blogspot.si/2014/03/custom-error-objects-in-javascript.html)
function InfoTripApiError(msg) {
    Error.captureStackTrace(this);
    this.message = msg;
    this.name = "InfoTripApiError";
}

module.exports = InfoTrip;
