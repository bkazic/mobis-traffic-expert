var express = require('express');
var logger = require("../my_modules/utils/logger/logger.js");
var app = express();

logger.debug("Overriding 'Express' logger");
app.use(require('morgan')("combined", { "stream": logger.stream }));

function init(base) {
    var base = base;
    
    // Create server with express
    app.get('/', function (req, res) {
        res.send('hello world');
    });
    
    app.get('/traffic-prediction/get-store-list', function (req, res) {
        var storeList = base.getStoreList().map(function (store) { return store.storeName })
        res.send(storeList);
    });
    
    app.get('/traffic-prediction/get-sensor-ids', function (req, res) {
        var sensorIdsList = [];
        base.getStoreList().forEach(function (store) {
            if (store.storeName.indexOf("resampledStore") != -1) {
                sensorIdsList.push(store.storeName.slice(-7).replace("_","-"));
            }
        });
        res.json(sensorIdsList);
    });

    app.get('/traffic-prediction/:id', function (req, res) {
        var id = req.params.id;
        id = id.replace("-", "_");
        var store = base.store("resampledStore_" + id);
        
        // Return from function if store with particular sensor id was not found
        if (store == null) {
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
