var express = require('express');
var logger = require("../my_modules/utils/logger/logger.js");
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());
logger.debug("Overriding 'Express' logger");
app.use(require('morgan')("combined", { "stream": logger.stream }));

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
        console.log("Recieved new record: " + JSON.stringify(req.body));
        res.status(200).send('OK');
        //TODO - push record to database
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

}

// Functions that starts the server
function start(_port) {
    var port = _port || process.env.port || 1337;
    app.listen(port);
    console.log("Express server listening on port %d in %s mode", port, app.settings.env);
}

exports.init = init;
exports.start = start;
