var logger = require("../../my_modules/utils/logger/logger.js");

// Constructor
function ServiceHandler(base, app) {
    this.base = base;
    this.app = app;
}

// get router paths
ServiceHandler.prototype.getRouterPaths = function (req, res) {
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
ServiceHandler.prototype.closeBase = function (req, res) {
    try {
        this.base.close();
        res.status(200).json({ message: "Base closed" });
    }
        catch (err) {
        if (typeof err.message != 'undefined' && err.message == "[addon] Exception: Base is closed!") {
            res.status(400).json({ error: "Base is allready closed" });
            logger.info("Cannot close Base. Base is allready closed.");
        }
        else {
            res.status(400).json({ error: "Something went wrong when closing Base." });
            logger.error("Something went wrong when closing Base")
        }
    }
}

module.exports = ServiceHandler;