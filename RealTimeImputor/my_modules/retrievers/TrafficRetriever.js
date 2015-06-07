var request = require('request');
var logger = require('../logger/logger.js')

// Constructor
function TrafficRetriever(options) {
    this.url = options.url || "http://opendata.si/promet/counters/";
    this.lastUpdated = 0;
}

TrafficRetriever.prototype.fetchData = function (callback) {
 
    request(this.url, function (error, response, body) {
        if (error) {
            logger.error(err.stack);
            return callback(error);
        }
        if (response.statusCode !== 200) throw new Error("Request Failed")
        
        // Find field "updated", without parsing the whole body to JSON
        var indexOfUpdated = body.indexOf("updated");
        if (indexOfUpdated == -1) {
            var err = new Error("Did not find field \"updated\".")
            logger.error(err.stack);
            return callback(err);
        }
        
        // Extract field "updated"
        var updated = parseInt(body.substring(indexOfUpdated + 10, indexOfUpdated + 20));
        
        // Check if this record was allredy fetched
        if (updated != this.lastUpdated) {
            logger.info("Fetched new record with timestamp %s!", updated)
            this.lastUpdated = updated;
            var data = JSON.parse(body);
            return callback(null, data);
        } 
        else {
            logger.debug("Record with timestamp %s was allready fetched.", updated)
        }

    }.bind(this));

}

TrafficRetriever.prototype.sendTo = function () {
    // TODO
}

TrafficRetriever.prototype.saveToFile = function () {
    // TODO
}

TrafficRetriever.prototype.saveToMongo = function () {
    // TODO
}

module.exports = TrafficRetriever;