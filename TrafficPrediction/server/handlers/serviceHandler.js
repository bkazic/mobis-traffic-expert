var logger = require("../../my_modules/utils/logger/logger.js");

// Constructor
function ServiceHandler(base, app) {
    this.base = base;
    this.app = app;
}

// get router paths
ServiceHandler.prototype.handleGetRouterPaths = function (req, res) {
    var routerPaths = [];
    var test = this.app;
    this.app._router.stack.forEach(function (item) {
        if (item.route != undefined) {
            routerPaths.push({ "path": item.route.path, "methods": item.route.methods });
        }
    });
    res.json(routerPaths);
}

// close Base
ServiceHandler.prototype.handleCloseBase = function (req, res) {
    try {
        this.base.close();
        res.status(200).json({ message: "Base closed" });
    }
    catch (err) {
        if (typeof err.message != 'undefined' && err.message == "[addon] Exception: Base is closed!") {
            res.status(500).json({ error: "Base is allready closed" });
            logger.warn("Cannot close Base. Base is allready closed.");
        }
        else {
            res.status(500).json({ error: "Something went wrong when closing Base." });
            logger.error(err.stack);
        }
    }
}

// Returns list of all store names
ServiceHandler.prototype.handleGetStoreList = function (req, res) {
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
            logger.error(err.stack);
        }
    }
}


ServiceHandler.prototype.handleGetStoreRecs = function (req, res) {
    var storeName = req.params.store; // TODO: try cath
    var limit = 10;
    var recs = [];

    try {
        var thisStore = this.base.store(storeName);     
        // check if store was found
        if (thisStore == null) {
            logger.warn("Store with name %s was not found.", storeName); console.log()
            res.status(400).send({ error: "Store with name " + storeName + " was not found."});
            return;
        }
        
        var offset = thisStore.length - limit;
        offset = (offset > 0) ? offset : 0   // in case offset is negative, set it to 0. Otherwise program crashes.
        var recs = thisStore.recs.trunc(limit, offset).reverse().toJSON();
        
        // check if any record was found
        if (recs['$hits'] === 0) {
            res.status(400).json({ error: "No records found" });
            logger.warn("No records found"); console.log();
            return;
        }
        
        res.status(200).json(recs['records'])
    }
    catch (err) {
        if (typeof err.message != 'undefined' && err.message == "[addon] Exception: Base is closed!") {
            res.status(500).json({ error: "Base is closed!" });
            logger.warn("Cannot execute. Base is closed!"); console.log();
        }
        else {
            res.status(500).json({ error: "Internal Server Error" });
            logger.error(err.stack);
        }
    }
}


module.exports = ServiceHandler;