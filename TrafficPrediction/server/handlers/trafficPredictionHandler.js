var logger = require("../../my_modules/utils/logger/logger.js");


// Constructor
var TrafficPredictionHandler = function (_base) {
    this.base = _base;
}


// Returns list of all store names
TrafficPredictionHandler.prototype.handleGetStoreList = function (req, res) {
    try {
        var storeList = this.base.getStoreList().map(function (store) { return store.storeName });
        res.status(200).json(storeList);
    }
    catch (err) {
        if (typeof err.message != 'undefined' && err.message == "[addon] Exception: Base is closed!") {
            res.status(500).json({ error: "Base is closed!" });
            logger.warn("Cannot execute. Base is closed!");
        }
        else {
            res.status(500).json({ error: "Internal Server Error" });
            logger.error(err.toString()); // This only returns message
            logger.debug(err); // Returns entire error mesage, but it will go in console only.
        }
    }
}


// Returns sensor id stores
TrafficPredictionHandler.prototype.handleGetSensors = function (req, res) {
    try {
        res.status(200).json(this.base.store("CounterNode").recs.toJSON().records);
    }
    catch (err) {
        if (typeof err.message != 'undefined' && err.message == "[addon] Exception: Base is closed!") {
            res.status(500).json({ error: "Base is closed!" });
            logger.warn("Cannot execute. Base is closed!");
        }
        else {
            res.status(500).json({ error: "Internal Server Error" });
            logger.error(err.toString()); // This only returns message
            logger.debug(err); // Returns entire error mesage, but it will go in console only.
        }
    }
}


// Returns traffic prediction from all sensors
TrafficPredictionHandler.prototype.handleGetTrafficPredictions = function (req, res) {
    var recs = [];
    var base = this.base;
    try {
        base.getStoreList().forEach(function (storeNm) {
            if (storeNm.storeName.indexOf("resampledStore") != -1) {
                var store = base.store(storeNm.storeName);
                if (store.last != null) {
                    recs.push(store.last.toJSON(true, true))
                }
            }
        });
        res.status(200).json(recs);
    }
    catch (err) {
        if (typeof err.message != 'undefined' && err.message == "[addon] Exception: Base is closed!") {
            res.status(500).json({ error: "Base is closed!" });
            logger.warn("Cannot execute. Base is closed!");
        }
        else {
            res.status(500).json({ error: "Internal Server Error" });
            logger.error(err.toString()); // This only returns message
            logger.debug(err); // Returns entire error mesage, but it will go in console only.
        }
    }
}


// Returns traffic prediction for specific sensor (params.id)
TrafficPredictionHandler.prototype.handleGetTrafficPredictionsById = function (req, res) {
    var id = req.params.id;
    id = id.replace("-", "_");

    try {
        var store = this.base.store("resampledStore_" + id);
        
        // Return from function if store with particular sensor id was not found
        if (store.last == null) {
            res.status(400).send('Prediction for this sensor ID does not exists');
            return;
        }
        res.json(store.last.toJSON(true, true));
    }
    catch (err) {
        if (typeof err.message != 'undefined' && err.message == "[addon] Exception: Base is closed!") {
            res.status(500).json({ error: "Base is closed!" });
            logger.warn("Cannot execute. Base is closed!");
        }
        else {
            res.status(500).json({ error: "Internal Server Error" });
            logger.error(err.toString()); // This only returns message
            logger.debug(err); // Returns entire error mesage, but it will go in console only.
        }
    }
}

// Handle add measurement request
TrafficPredictionHandler.prototype.handleAddMeasurement = function (req, res) {
    // If you want to test from Simple REST Client, make sure you add in headers: Content-Type: application/json
    var rec = req.body;
    logger.debug("Recieved new record: " + JSON.stringify(req.body));
    
    // Check for empty records.
    if (Object.keys(rec).length == 0) {
        logger.info("Recieved empty record. It will not be stored.");
        res.status(400).json({ error: "Recieved empty record. It will not be stored." })
        return;
    }    
    
    // Check if imputor has reached the end 
    if (req.body.msg) {
        logger.debug(req.body.msg);
        return;
    }
    
    // Find proper store
    id = rec.measuredBy.Name.replace("-", "_");
    trafficStore = this.base.store("trafficStore_" + id);
    
    var id = trafficStore.add(rec);
    
    // If record was not stored sucesfully, id will be -1
    if (id == -1) {
        logger.warn("Record was not stored");
        res.status(400).json({ error: 'Record not stored!' })
        return;
    }
    
    logger.debug("Record stored into store %s. Store length: %s ", trafficStore.name, trafficStore.length);
    res.status(200).json({message: "OK"});
}

module.exports = TrafficPredictionHandler;