var express = require('express');
var logger = require("../my_modules/utils/logger/logger.js");
var bodyParser = require('body-parser');
var routes = require('./routes');
var ServiceHandler = require('./handlers/serviceHandler.js');
var TrafficPredictionHandler = require('./handlers/trafficPredictionHandler.js');
var app = express();

app.use(bodyParser.json());
app.use(require('morgan')("combined", { "stream": logger.stream }));

logger.debug("Overriding 'Express' logger");


function init(base) {
    var base = base;
    
    // Lists all possible costs
    app.get('/', function (req, res) {
        var routerPaths = [];
        app._router.stack.forEach(function (item) {
            if (item.route != undefined) {
                routerPaths.push({ "path": item.route.path,"methods": item.route.methods });
            }
        });
        res.json(routerPaths);
    });
    
    // Returns predictions from all sensors
    app.get('/traffic-predictions', function (req, res) {
        var recs = [];
        base.getStoreList().forEach(function (storeNm) {
            if (storeNm.storeName.indexOf("resampledStore") != -1) {
                var store = base.store(storeNm.storeName);
                if (store.last != null) {
                    recs.push(store.last.toJSON(true, true))
                }
            }
        });
        
        res.json(recs)
    });
    
    // Returns list of all store names
    app.get('/traffic-predictions/get-store-list', function (req, res) {
        var storeList = base.getStoreList().map(function (store) { return store.storeName });
        res.send(storeList);
    });
    
    // Returns sensor id stores
    app.get('/traffic-predictions/get-sensors', function (req, res) {
        res.json(base.store("CounterNode").recs.toJSON().records);
    });
    
    // Adds sensor measurement
    app.post('/add', function (req, res) {
        var rec = req.body;
        logger.debug("Recieved new record: " + JSON.stringify(req.body));
        
        // Check for empty records.
        if (Object.keys(rec).length == 0) {
            logger.warn("Recieved empty record. It will not be stored.");
            res.status(400).send('Record not stored!')
            return;
        }        ;
        
        // Check if imputor has reached the end 
        if (req.body.msg) {
            logger.debug(req.body.msg);
            return;
        }
        
        // Find proper store
        id = rec.measuredBy.Name.replace("-", "_");
        trafficStore = base.store("trafficStore_" + id);
        
        var id = trafficStore.add(rec);
        
        // If record was not stored sucesfully, id will be -1
        if (id == -1) {
            logger.warn("Record was not stored");
            res.status(400).send('Record not stored!')
            return;
        }
        
        logger.debug("Record stored into store %s. Store length: %s ", trafficStore.name, trafficStore.length);
        res.status(200).send('OK');

    });

    // Returns predictions for specific sensor
    app.get('/traffic-predictions/:id', function (req, res) {
        var id = req.params.id;
        id = id.replace("-", "_");
        var store = base.store("resampledStore_" + id);
        
        // Return from function if store with particular sensor id was not found
        if (store.last == null) {
            res.status(400).send('Prediction for this sensor ID does not exists');
            return;
        }
        res.json(store.last.toJSON(true, true));
    });

    // Base close call
    app.get('/close-base', function (req, res) {
        try {
            base.close();
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
    });

}


// TODO
function init(base) {
    // init handlers
    var handlers = {
        service: new ServiceHandler(base, app),
        trafficPrediction: new TrafficPredictionHandler(base)
    };
    
    // init routes
    routes.setup(app, handlers)
}

// Functions that starts the server
function start(_port) {
    var port = _port || process.env.port || 1337;
    app.listen(port);
    console.log("\n[Server] Express server listening on port %d in %s mode", port, app.settings.env);
}

exports.init = init;
exports.start = start;
exports.app = app;
