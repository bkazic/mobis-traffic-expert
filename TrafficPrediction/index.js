var qm = require('qminer')
var server = require('./server/server.js');
var createBase = require('./createBase.js');
var env = process.env.NODE_ENV || 'development';
var config = require('./config.json')[env];

// Set verbosity of QMiner internals
qm.verbosity(0);

// read input script argument for mode type. Default is "cleanCreate"
var scriptArgs = (process.argv[2] == null) ? "cleanCreate" : process.argv[2];
var base = createBase.mode(scriptArgs);

// START SERVER
server.init(base);
server.start(config.trafficPredictionService.server.port);