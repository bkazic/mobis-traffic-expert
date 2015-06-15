var request = require('request');
var logger = require('../logger/logger.js');
var async = require('async');

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
            logger.info("Record with timestamp %s was allready fetched.", updated)
        }
    }.bind(this));
}

async.eachSeries


// Parse all measurements first, and send them after
//TrafficRetriever.prototype.test = function (callback) {
//    this.fetchData(function (error, data) {
//        if (error) return callback(error)
        
//        var count = 0; // Just for debugging

//        data.feed.entry.forEach(function (rec) {
//            process.nextTick(function () {
//                measurementRec = formatMeasurementRecord(rec);
//                callback(null, measurementRec);
                
//                logger.debug("Count:", count++); // Just for debugging
//            });            
//        });

//    });
//}


// USING ASYNC MODULE
// Parse and send measurement one by one.
TrafficRetriever.prototype.test = function (callback) {
    this.fetchData(function (error, data) {
        if (error) return callback(error)
        
        var count = 0; // Just for debugging
        
        async.eachSeries(data.feed.entry, function iterator(rec, next) {
            measurementRec = formatMeasurementRecord(rec);
            callback(null, measurementRec, next);
            
            logger.debug("Count:", count++); // Just for debugging

        }, function (err) {
            if (err) throw err;
            logger.info("My job here is done. Going to sleep.");
            // TODO Report status --> how many records was added, how many discarded.
        });

    });
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

// Formating measure record to match QMiner format
function formatMeasurementRecord(data) {
    var rec = {
        DateTime: generateDateTime(checkField(data, "stevci_ura"), checkField(data, "stevci_datum")),
        NumOfCars: checkField(data, "stevci_stev"),
        Occupancy: checkField(data, "stevci_occ"),
        Speed: checkField(data, "stevci_hit"),
        TrafficStatus: checkField(data, "stevci_stat"),
        measuredBy: { Name: checkField(data, "id") }
    };
    
    return rec;
}

// generate DateTime object (ISO format)
function generateDateTime(dateString, timeString) {
    try {
        var date = new Date(dateString + timeString)//TODO: check if in traffic prediction model .toISOString works correctly
    } catch (e) {
        logger.error(e.stack)
    }
    // Ugly Hack: TrafficPrediction model expects datetime in ISOFormat but with local offset (+2H)
    var tzoffset = (new Date()).getTimezoneOffset() * 60000; // Ugly Hack
    var date = new Date(date - tzoffset) // Ugly Hack
    
    return date.toISOString().slice(0, -5); // Slice removes ".000Z" which represents Zulu timezone
}

// Check if this field exists. If not, throw error.
function checkField(input, fieldNm) {
    if (input.hasOwnProperty(fieldNm)) {
        return input[fieldNm]
    } else {
        throw new ParsingError(fieldNm)
    }
}

// Costum Parsing Error
function ParsingError(field) {
    this.name = "ParsingError";
    this.message = "field \"" + field + "\" does not exist in object";
    this.toString = function () { return this.name + ": " + this.message };
}
ParsingError.prototype = Object.create(Error.prototype);
ParsingError.prototype.constructor = ParsingError;

module.exports = TrafficRetriever;