var qm = require('qminer');
var assert = require('assert');
var TrafficExpert = require('../TrafficExpert.js');
var predictionService = require('../predictionService.js');
var server = require('../server/server.js');
var path = require('path');
var fs = require('fs');
var request = require('supertest');
var env = process.env.NODE_ENV || 'test';
var config = require('../config.json')[env];

describe('Testing start modes:', function () {

    var url = config.trafficPredictionService.server.root;
    var base = undefined;
    var trafficExpert = undefined;

    // test cleanCreate mode
    describe('cleanCreate', function () {
        
        // create base and start server on localhost before each test
        beforeEach(function () {
            this.timeout(30000);
            // Initialise base in clean create mode   
            base = new qm.Base({ mode: 'createClean' })
            // Initialize trafficExpert service
            trafficExpert = new TrafficExpert();
            trafficExpert.init(base);
            // Initialize and start serverserver
            server.init(trafficExpert);
            server.start(config.trafficPredictionService.server.port);
        });
        
        // after each test close base and server
        afterEach(function (done) {
            this.timeout(10000);
            base.close();
            server.close(done);
        });
        
        it('should sucessfully start server', function (done) {
            request(url)
            .get("/")
            .set('Accept', 'application/json')
            .expect(200, done)
        });

        it('should have empty store', function () {
            assert.equal(base.store("rawStore_1").length, 0);
        });

    });
    
    // test cleanCreateLoad mode
    describe('cleanCreateLoad', function () {
        
        // create base and start server on localhost before each test
        beforeEach(function () {
            this.timeout(30000);
            // Initialise base in clean create mode   
            base = new qm.Base({ mode: 'createClean' })
            // Initialize trafficExpert service
            var trafficExpert = new TrafficExpert();
            trafficExpert.init(base);
            // Import initial data
            qm.load.jsonFile(base.store("rawStore_1"), path.join(__dirname, "../sandbox/data-small.json"));
            // Initialize and start serverserver
            server.init(trafficExpert);
            server.start(config.trafficPredictionService.server.port);
        });
        
        // after each test close base and server
        afterEach(function (done) {
            this.timeout(10000);
            trafficExpert.shutdown();
            base.close();
            server.close(done);
        });
        
        it('should sucessfully start server', function (done) {
            request(url)
            .get("/")
            .set('Accept', 'application/json')
            .expect(200, done)
        });

        it('should not have empty store', function () {
            assert.notEqual(base.store("rawStore_1").length, 0);
        });

        it('should be able to add new record', function (done) {
            request(url)
              .post('/traffic-predictions/add')
              .send({
                    "Origin": 76, "MacAddress": null, "Comment#1": "Estimation", 
                    "Destination": 80, "DateTime": "2015-04-01T05:56:04", 
                    "Comment#2": "OK", "AverageSpeed": 93.3, "TravelTime": 8.4,
                    "Sensor": { "pathId": 1 }
                })
              .expect(200, done)
        });

    });

    
    // test open mode
    describe('open', function () {
       
        // create base and start server on localhost before each test
        beforeEach(function () {
            this.timeout(30000);
            // Initialise base in clean create mode   
            base = new qm.Base({ mode: 'open' })
            // Initialize trafficExpert service
            var trafficExpert = new TrafficExpert();
            trafficExpert.init(base);
            // Initialize and start serverserver
            server.init(trafficExpert);
            server.start(config.trafficPredictionService.server.port);
        });
        
        // after each test close base and server
        afterEach(function (done) {
            this.timeout(10000);
            trafficExpert.shutdown();
            base.close();
            server.close(done);
        });
        
        it('should sucessfully start server', function (done) {
            request(url)
            .get("/")
            .set('Accept', 'application/json')
            .expect(200, done)
        });
        
        it('should not have empty store', function () {
            assert.notEqual(base.store("rawStore_1").length, 0);
        });

        it('should be able to add new record', function (done) {
            request(url)
              .post('/traffic-predictions/add')
              .send({
                "Origin": 76, "MacAddress": null, "Comment#1": "Estimation", 
                "Destination": 80, "DateTime": "2015-04-01T05:56:04", 
                "Comment#2": "OK", "AverageSpeed": 93.3, "TravelTime": 8.4,
                "Sensor": { "pathId": 1 }
            })
              .expect(200, done)
        });

        it('should have mobisModels loaded', function () {
            assert.notEqual(Object.keys(trafficExpert.mobisModels).length, 0);
        });

    });

    // test openReadOnly mode
    describe('openReadOnly', function () {
        
        // create base and start server on localhost before each test
        beforeEach(function () {
            this.timeout(30000);
            // Initialise base in clean create mode   
            base = new qm.Base({ mode: 'openReadOnly' })
            // Initialize trafficExpert service
            var trafficExpert = new TrafficExpert();
            trafficExpert.init(base);
            // Initialize and start serverserver
            server.init(trafficExpert);
            server.start(config.trafficPredictionService.server.port);
        });
        
        // after each test close base and server
        afterEach(function (done) {
            this.timeout(10000);
            trafficExpert.shutdown();
            base.close();
            server.close(done);
        });
        
        it('should sucessfully start server', function (done) {
            request(url)
            .get("/")
            .set('Accept', 'application/json')
            .expect(200, done)
        });
        
        it('should not have empty store', function () {
            assert.notEqual(base.store("rawStore_1").length, 0);
        });
        
        it('should not be able to add new record', function (done) {
            request(url)
              .post('/traffic-predictions/add')
              .send({
                "Origin": 76, "MacAddress": null, "Comment#1": "Estimation", 
                "Destination": 80, "DateTime": "2015-04-01T05:56:04", 
                "Comment#2": "OK", "AverageSpeed": 93.3, "TravelTime": 8.4,
                "Sensor": { "pathId": 1 }
            })
              .expect(500, done)
        });
        
        it('should have mobisModels loaded', function () {
            assert.notEqual(Object.keys(trafficExpert.mobisModels).length, 0);
        });

    });

    // test restoreFromBackup mode
    describe('restoreFromBackup', function () { 
        //TODO
    });

});