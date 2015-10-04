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
    // get (first) admin name and password from config
    var admin = Object.keys(config.admins)[0];
    var password = config.admins[admin].password
    
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
        
        // Import initial data
        qm.load.jsonFile(base.store("rawStore"), path.join(__dirname, "../sandbox/data-small.json"));
        
        // Initialize and start serverserver
        server.init(base);
        server.start(config.trafficPredictionService.server.port);
    });
    
    // after each test close base and server
    afterEach(function (done) {
        base.close();
        server.close(done);
    })
    
    // localhost:3333/
    it('#GET ' + url + "/", function (done) {
        request(url)
            .get("/")
            .set('Accept', 'application/json')
            .expect(200, done)
    });
    
    // localhost:3333/close-base
    it('#GET ' + url + "/close-base", function (done) {
        request(url)
            .get("/get-store-list")
            .auth(admin, password)
            .set('Accept', 'application/json')
            .expect(200, done)
    });
    
    // localhost:3333/get-store-list
    it('#GET ' + url + "/get-store-list", function (done) {
        // get (first) admin name from config
        var adminName = Object.keys(config.admins)[0];
        request(url)
            .get("/get-store-list")
            .auth(admin, password)
            .set('Accept', 'application/json')
            .expect(200, done)
    });
    
    // localhost:3333/get-store-recs/rawStore
    it('#GET ' + url + "/get-store-recs/rawStore", function (done) {
        // get (first) admin name from config
        var adminName = Object.keys(config.admins)[0];
        request(url)
            .get("/get-store-recs/rawStore")
            .auth(admin, password)
            .set('Accept', 'application/json')
            .expect(200, done)
    });
    
    // localhost:3333/get-store-recs/rawStore?limit=5
    it('#GET ' + url + "/get-store-recs/rawStore?limit=5", function (done) {
        // get (first) admin name from config
        var adminName = Object.keys(config.admins)[0];
        request(url)
            .get("/get-store-recs/rawStore?limit=5")
            .auth(admin, password)
            .set('Accept', 'application/json')
            .expect(200, done)
    });
    
    // localhost:3333/get-store-recs/resampledStore?limit=5
    it('#GET ' + url + "/get-store-recs/resampledStore?limit=5", function (done) {
        // get (first) admin name from config
        var adminName = Object.keys(config.admins)[0];
        request(url)
            .get("/get-store-recs/resampledStore?limit=5")
            .auth(admin, password)
            .set('Accept', 'application/json')
            .expect(200, done)
    });
    
    // localhost:3333/get-store-recs/predictionStore?limit=5
    it('#GET ' + url + "/get-store-recs/predictionStore?limit=5", function (done) {
        // get (first) admin name from config
        var adminName = Object.keys(config.admins)[0];
        request(url)
            .get("/get-store-recs/predictionStore?limit=5")
            .auth(admin, password)
            .set('Accept', 'application/json')
            .expect(200, done)
    });
    
    // localhost:3333/get-store-recs/evaluationStore?limit=5
    it('#GET ' + url + "/get-store-recs/evaluationStore?limit=5", function (done) {
        // get (first) admin name from config
        var adminName = Object.keys(config.admins)[0];
        request(url)
            .get("/get-store-recs/evaluationStore?limit=5")
            .auth(admin, password)
            .set('Accept', 'application/json')
            .expect(200, done)
    });
    
    // localhost:3333/traffic-predictions/get-sensors
    it('#GET ' + url + "/traffic-predictions/get-sensors", function (done) {
        // get (first) admin name from config
        var adminName = Object.keys(config.admins)[0];
        request(url)
            .get("/traffic-predictions/get-sensors")
            .set('Accept', 'application/json')
            .expect(501, done)
    });

    // localhost:3333/traffic-predictions
    it('#GET ' + url + "/traffic-predictions", function (done) {
        request(url)
            .get("/traffic-predictions")
            .set('Accept', 'application/json')
            .expect(200, done)
    });
    
    // localhost:3333/traffic-predictions/add
    it('#POST ' + url + "/traffic-predictions/add", function (done) {
        request(url)
          .post('/traffic-predictions/add')
          .send({
            "Origin": 76, "MacAddress": null, "Comment#1": "Estimation", 
            "Destination": 80, "DateTime": "2015-04-01T05:56:04", 
            "Comment#2": "OK", "AverageSpeed": 93.3, "TravelTime": 8.4})
          .expect(200, done)
    });
    
});

// references how to build rest api unit tests
// [1] https://thewayofcode.wordpress.com/2013/04/21/how-to-build-and-test-rest-api-with-nodejs-express-mocha/
// [2] https://github.com/visionmedia/supertest
// [3] http://51elliot.blogspot.si/2013/08/testing-expressjs-rest-api-with-mocha.html
// [4] http://glebbahmutov.com/blog/how-to-correctly-unit-test-express-server/