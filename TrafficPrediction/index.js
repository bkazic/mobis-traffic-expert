var qm = require('qminer')
var server = require('./server/server.js');
var predictionService = require('./predictionService.js');
var TrafficExpert = require('./TrafficExpert.js');
var env = process.env.NODE_ENV || 'development';
var config = require('./config.json')[env];

// Set verbosity of QMiner internals
qm.verbosity(0);

// create traffic expert model instance
var trafficExpert = new TrafficExpert();

// read input script argument for mode type. Default is "cleanCreate"
var mode = (process.argv[2] == null) ? "cleanCreate" : process.argv[2];
predictionService.start(trafficExpert, mode);

// START SERVER
server.init(trafficExpert); 
server.start(config.trafficPredictionService.server.port);