﻿var logger = require("../../my_modules/utils/logger/logger.js");


// Constructor
var TrafficPredictionHandler = function (_base) {
    this.base = _base;
}


// Returns sensor id stores
TrafficPredictionHandler.prototype.handleGetSensors = function (req, res) {
    //res.status(501).json({ message: "Not implemented yet" })
    try {
        res.status(200).json(this.base.store("sensorsStore").allRecords.toJSON().records);
    }
    catch (err) {
        if (typeof err.message != 'undefined' && err.message == "[addon] Exception: Base is closed!") {
            res.status(500).json({ error: "Base is closed!" });
            logger.warn("Cannot execute. Base is closed! " + err.stack);
        }
        else {
            res.status(500).json({ error: "Internal Server Error" });
            logger.error(err.stack); 
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
            logger.warn("Cannot execute. Base is closed! " + err.stack);
        }
        else {
            res.status(500).json({ error: "Internal Server Error" });
            logger.error(err.stack);
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
            res.status(400).send({ error: 'Prediction for sensor ID "' + id  + '" does not exists' });
            logger.warn('Prediction for sensor ID ' + id + ' does not exists');
            return;
        }
        res.json(store.last.toJSON(true, true));
    }
    catch (err) {
        if (typeof err.message != 'undefined' && err.message == "[addon] Exception: Base is closed!") {
            res.status(500).json({ error: "Base is closed!" });
            logger.warn("Cannot execute. Base is closed! " + err.stack); 
        }
        else {
            res.status(500).json({ error: "Internal Server Error" });
            logger.error(err.stack);
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
        logger.warn("Recieved empty record. It will not be stored."); 
        res.status(400).json({ error: "Recieved empty record. It will not be stored." }).end();
        return;
    }
    
    // Check if imputor has reached the end 
    if (req.body.message && req.body.message.indexOf("[IMPUTOR]") != -1) {
        logger.info(req.body.message);
        res.status(200).json({ message: "OK" }).end();
        return;
    }
    
    // Extract id
    try {
        id = rec.Sensor.pathId;
    }
    catch (err) {
        if (typeof err.message != 'undefined' && err.message.indexOf("Cannot read property") != -1) {
            res.status(500).json({ error: "Record does not include property 'Sensor'" }).end();
            logger.error("Record does not include property 'Sensor', from which the 'pathId' can be found. " + err.stack);
            return;
        }
        else {
            res.status(500).json({ error: "Internal Server Error" }).end();
            logger.error(err.stack);
        }
    }
    
    // Find proper store
    var storeName = "rawStore_" + id;
    trafficStore = this.base.store(storeName);
    if (trafficStore == null) {
        logger.warn("Store with name %s was not found. Cannot add record.", storeName);
        res.status(500).json({error: "Store with pathId " + id + " was not found. Cannot add record."}).end();
        return;
    }

    // Try to add record to store
    try {
        //console.log(JSON.stringify(rec,null,2)) // DEBUGING
        var id = trafficStore.push(rec);
    }
    catch (err) {
        res.status(500).json({ error: "Internal Server Error" }).end();
        logger.error(err.stack);
    }
    
    // If record was not stored sucesfully, id will be -1
    if (id == -1) {
        logger.error("Record was not stored"); 
        res.status(400).json({ error: 'Record not stored!' }).end()
        return;
    }
    
    logger.debug("Record stored into store %s. Store length: %s ", trafficStore.name, trafficStore.length);
    logger.info("New record was stored into store %s. Record: %s", trafficStore.name, JSON.stringify(req.body));
    res.status(200).json({message: "OK"}).end();
}

module.exports = TrafficPredictionHandler;