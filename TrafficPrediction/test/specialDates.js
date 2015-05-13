var qm = require('qminer');
var assert = require('assert');

describe('SpecialDays module tests', function () {
    
    // Define stores
    qm.delLock();
    qm.config('qm.conf', true, 8080, 1024);
    global.base = qm.create('qm.conf', 'schema.def', true);
    var testStore = base.store('testStore');
    
    SpecialDates = require('../my_modules/utils/specialDates.js')
    var specialDaysPath = "../sandbox/specialDates.txt"
    var specialDates = new SpecialDates.SpecialDatesFtrExtractor(base, specialDaysPath, "Slovenian_holidays");
    
    describe('testing module for date: 2015-01-01T01:00:00', function () {
        
        testStore.add({ "DateTime": "2015-01-01T01:00:00" })
        var rec = testStore.last;
        
        it('#getFeature(rec) should return 1', function () {
            assert.equal(1, specialDates.getFeature(rec))
        });
        it('#isWeekend(rec) should return 0', function () {
            assert.equal(0, specialDates.isWeekend(rec))
        });
        it('#isWorkingDay(rec) should return 0', function () {
            assert.equal(0, specialDates.isWorkingDay(rec))
        });
    });

    describe('testing module for date: 2015-01-02T01:00:00', function () {
        
        testStore.add({ "DateTime": "2015-01-02T01:00:00" })
        var rec = testStore.last;
        
        it('#getFeature(rec) should return 0', function () {
            assert.equal(0, specialDates.getFeature(rec))
        });
        it('#isWeekend(rec) should return 0', function () {
            assert.equal(0, specialDates.isWeekend(rec))
        });
        it('#isWorkingDay(rec) should return 1', function () {
            assert.equal(1, specialDates.isWorkingDay(rec))
        });
    });

    describe('testing module for date: 2015-01-03T01:00:00', function () {
        
        testStore.add({ "DateTime": "2015-01-03T01:00:00" })
        var rec = testStore.last;
        
        it('#getFeature(rec) should return 0', function () {
            assert.equal(0, specialDates.getFeature(rec))
        });
        it('#isWeekend(rec) should return 1', function () {
            assert.equal(1, specialDates.isWeekend(rec))
        });
        it('#isWorkingDay(rec) should return 0', function () {
            assert.equal(0, specialDates.isWorkingDay(rec))
        });
    });

});