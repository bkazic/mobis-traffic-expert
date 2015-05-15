var qm = require('qminer');
var assert = require('assert');
var path = require('path');

var base = new qm.Base({
    mode: 'createClean',
    schema: [
        {
            "name": "testStore",
            "fields": [
                { "name": "DateTime", "type": "datetime", "primary": true },
                { "name": "NumOfCars", "type": "float", "null": true },
                { "name": "Gap", "type": "float", "null": true },
                { "name": "Occupancy", "type": "float", "null": true },
                { "name": "Speed", "type": "float", "null": true },
                { "name": "TrafficStatus", "type": "float", "null": true }
            ]
        }
    ],
    dbPath: path.join(__dirname, './db') 
});

var testStore = base.store('testStore');

describe('SpecialDates module tests', function () {
    
    SpecialDates = require('../my_modules/utils/special-dates/special-dates.js')
    var SlovenianHolidays = SpecialDates.newSpecialDates('Slovenian_holidays');
    var FoolMoon = SpecialDates.newSpecialDates('Full_moon');
    var CalendarFtrs = SpecialDates.newCalendarFeatures();

    describe('testing module for date: 2015-01-01T01:00:00', function () {
        
        testStore.add({ "DateTime": "2015-01-01T01:00:00" })
        var rec = testStore.last;
        
        it('#getFeature(rec) should return 1', function () {
            assert.equal(1, SlovenianHolidays.getFeature(rec))
        });
        it('#isWeekend(rec) should return 0', function () {
            assert.equal(0, CalendarFtrs.isWeekend(rec))
        });
        it('#isWorkingDay(rec) should return 0', function () {
            assert.equal(0, CalendarFtrs.isWorkingDay(rec))
        });
    });

    describe('testing module for date: 2015-01-02T01:00:00', function () {
        
        testStore.add({ "DateTime": "2015-01-02T01:00:00" })
        var rec = testStore.last;
        
        it('#getFeature(rec) should return 0', function () {
            assert.equal(0, SlovenianHolidays.getFeature(rec))
        });
        it('#isWeekend(rec) should return 0', function () {
            assert.equal(0, CalendarFtrs.isWeekend(rec))
        });
        it('#isWorkingDay(rec) should return 1', function () {
            assert.equal(1, CalendarFtrs.isWorkingDay(rec))
        });
    });

    describe('testing module for date: 2015-01-03T01:00:00', function () {
        
        testStore.add({ "DateTime": "2015-01-03T01:00:00" })
        var rec = testStore.last;
        
        it('#getFeature(rec) should return 0', function () {
            assert.equal(0, SlovenianHolidays.getFeature(rec))
        });
        it('#isWeekend(rec) should return 1', function () {
            assert.equal(1, CalendarFtrs.isWeekend(rec))
        });
        it('#isWorkingDay(rec) should return 0', function () {
            assert.equal(0, CalendarFtrs.isWorkingDay(rec))
        });
    });

});