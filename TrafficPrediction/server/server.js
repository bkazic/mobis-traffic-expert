var logger = require("../my_modules/utils/logger/logger.js");
var bodyParser = require('body-parser');
var routes = require('./routes');
var ServiceHandler = require('./handlers/serviceHandler.js');
var TrafficPredictionHandler = require('./handlers/trafficPredictionHandler.js');
var app = undefined;
var server = undefined;

// Initialize handlers and server route paths
function init(base) {
    var express = require('express');
    app = express();
    app.use(bodyParser.json());

    app.use(require('morgan')("combined", { "stream": logger.stream }));
    logger.debug("Overriding 'Express' logger");

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
    server = app.listen(port);
    
    //console.log("\n\x1b[32m[Server] Express server listening on port %d in %s mode\n\x1b[0m", port, app.settings.env);
    logger.info("\x1b[32m[Server] Express server listening on port %d in %s mode\n\x1b[0m", port, app.settings.env)
}

// Exports
exports.init = init;
exports.start = start; // not sure if seperate method to start server is needed
exports.app = app;
exports.close = function (done) { server.close(done); }