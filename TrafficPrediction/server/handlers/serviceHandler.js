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
            logger.error(err.toString()); // This only returns message
            logger.debug(err); // Returns entire error mesage, but it will go in console only.
        }
    }
}

module.exports = ServiceHandler;