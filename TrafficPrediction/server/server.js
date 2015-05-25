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
    
    // Test
    app.get('/test', function (req, res) {
        res.send('This is a test!');
    });
    
    // Test
    app.get('/getStoreList', function (req, res) {
        var storeList = base.getStoreList().map(function (store) { return store.storeName })
        res.send(storeList);
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
