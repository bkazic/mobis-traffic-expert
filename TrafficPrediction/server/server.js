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

// Initialize handlers and server route paths
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

// Exports
exports.init = init;
exports.start = start;
exports.app = app;
