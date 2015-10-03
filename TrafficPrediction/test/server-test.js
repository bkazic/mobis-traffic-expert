var qm = require('qminer');
var assert = require('assert');
var trafficExpert = require('../TrafficExpert.js');
var server = require('../server/server.js');
var path = require('path');
var request = require('supertest');
var env = process.env.NODE_ENV || 'test';
var config = require('../config.json')[env];

// Set verbosity of QMiner internals
qm.verbosity(0);

// test if NODE_ENV is set to "test"
describe('Testing NODE_ENV', function () {
    it('should be set to "test"', function () {
        assert.equal(process.env.NODE_ENV, "test")
    });
})

// test services
describe('Server test', function () {
    var url = config.trafficPredictionService.server.root;
    var base = undefined;
    
    // create base and start server on localhost before each test
    beforeEach(function () { // this returns same error as *.js
        // Initialise base in clean create mode   
        base = new qm.Base({
            mode: 'createClean', 
            schemaPath: path.join(__dirname, '../store.def'), // its more robust but, doesen't work from the console (doesent know __dirname)
            dbPath: path.join(__dirname, './db'),
        })
        
        // Initialize trafficExpert service
        trafficExpert.init(base);
        
        // Initialize and start serverserver
        server.init(base);
        server.start(config.trafficPredictionService.server.port);
    });
    
    // after each test close base and server
    afterEach(function (done) {
        base.close();
        server.close(done);
    })

    it('#GET ' + url + "/", function (done) {
        request(url)
            .get("/")
            .set('Accept', 'application/json')
            .expect(200, done)
    });

    it('#GET ' + url + "/traffic-predictions", function (done) {
        request(url)
            .get("/traffic-predictions")
            .set('Accept', 'application/json')
            .expect(200, done)
    });

    it('#GET ' + url + "/get-store-list", function (done) {
        // get (first) admin name from config
        var adminName = Object.keys(config.admins)[0]; 
        request(url)
            .get("/get-store-list")
            .auth(adminName, config.admins[adminName].password)
            .set('Accept', 'application/json')
            .expect(200, done)
    });
});

// references how to build rest api unit tests
// [1] https://thewayofcode.wordpress.com/2013/04/21/how-to-build-and-test-rest-api-with-nodejs-express-mocha/
// [2] https://github.com/visionmedia/supertest
// [3] http://51elliot.blogspot.si/2013/08/testing-expressjs-rest-api-with-mocha.html
// [4] http://glebbahmutov.com/blog/how-to-correctly-unit-test-express-server/