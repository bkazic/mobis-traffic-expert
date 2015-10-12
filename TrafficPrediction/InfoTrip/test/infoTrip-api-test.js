var request = require('supertest');
var assert = require('assert');
var env = process.env.NODE_ENV || 'test';

describe('InfoTrip API test', function () {
    baseUrl = "http://tomcat.infotrip.gr/infotrip-wrapper/v1/infotrip";

    //Example: http://tomcat.infotrip.gr/infotrip-wrapper/v1/infotrip/deviationData
    it('#GET ' + baseUrl + "/deviationData", function (done) {
        request(baseUrl)
            .get("/deviationData")
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200, done)
    });

    //Example: http://tomcat.infotrip.gr/infotrip-wrapper/v1/infotrip/latestReasoning
    it('#GET ' + baseUrl + "/latestReasoning", function (done) {
        request(baseUrl)
            .get("/latestReasoning")
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200, done)
    });

    //Example: http://tomcat.infotrip.gr/infotrip-wrapper/v1/infotrip/pathData
    it('#GET ' + baseUrl + "/pathData", function (done) {
        request(baseUrl)
            .get("/pathData")
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200, done)
    });

    //Example: http://tomcat.infotrip.gr/infotrip-wrapper/v1/infotrip/updatePathData
    it('#POST ' + baseUrl + "/updatePathData", function (done) {
        var timestamp = new Date();
        var predTimestamp = new Date(timestamp);
        predTimestamp.setHours(predTimestamp.getHours() + 1);

        request(baseUrl)
            .post("/updatePathData")
            .send({
                "forecasts": [{
                        "pathId": 3, "statisticalForecastValue": 3, 
                        "timestamp": predTimestamp.toISOString()
                    }], 
                "realValues": [{
                        "pathId": 3, "realValue": 5, 
                        "timestamp": timestamp.toISOString()
                    }]
            })
            .end(function (err, res) {
                if (err) {
                    throw err;
                }
                // this is should.js syntax, very clear
                assert.equal(res.statusCode, 200);
                done();
            });
    });

});