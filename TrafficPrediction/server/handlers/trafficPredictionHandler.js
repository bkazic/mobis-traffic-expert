var logger = require("../../my_modules/utils/logger/logger.js");

// Constructor
var TrafficPredictionHandler = function (_base) {
    this.base = _base;
}

// TODO - add some try catch stuff
// Returns traffic prediction from all sensors
TrafficPredictionHandler.prototype.getTrafficPredictions = function (req, res) {
    var recs = [];
    this.base.getStoreList().forEach(function (storeNm) {
        if (storeNm.storeName.indexOf("resampledStore") != -1) {
            var store = this.base.store(storeNm.storeName);
            if (store.last != null) {
                recs.push(store.last.toJSON(true, true))
            }
        }
    });
    res.status(200).json(recs);
}

// TODO - add some try catch stuff - For Base is closed and stuff
// Returns list of all store names
TrafficPredictionHandler.prototype.getStoreList = function (req, res) {
    var storeList = this.base.getStoreList().map(function (store) { return store.storeName });
    res.status(200).json(storeList);
}

// TODO - add some try catch stuff
// Returns sensor id stores
TrafficPredictionHandler.prototype.getSensors = function (req, res) {
    res.status(200).json(this.base.store("CounterNode").recs.toJSON().records);
}

module.exports = TrafficPredictionHandler;