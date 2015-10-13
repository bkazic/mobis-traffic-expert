var assert = require("assert")   
var OnlineAverage = require('../my_modules/utils/baseline-models/online-average.js');

describe('baseline-models', function () {
    
    var average = new OnlineAverage();
    var average2 = new OnlineAverage();

    describe('#online-average - model #1', function () {
        
        // Testing first model: average
        // Pushing first testing number 5
        it('should return 5 - if we push one number 5', function () {
            assert.equal(5, average.update(5));
        });
        it('should return 1 - testing updatingCount', function () {
            assert.equal(1, average.updateCount);
        });
        it('should return 5 - testing getter', function () {
            assert.equal(5, average.getAvr());
        });
        
        // Pushing second testing number: 4
        it('should return 4 - if we push another number 3', function () {
            assert.equal(4, average.update(3));
        });
        it('should return 2 - testing updatingCount', function () {
            assert.equal(2, average.updateCount);
        });
        it('should return 4 - testing getter', function () {
            assert.equal(4, average.getAvr());
        });
    })
        
    describe('#online-average - model #2', function () {
        // Testing second model: average2
        // Pushing first testing number 5
        it('should return 6 - if we push one number 5', function () {
            assert.equal(6, average2.update(6));
        });
        it('should return 1 - testing updatingCount', function () {
            assert.equal(1, average2.updateCount);
        });
        it('should return 6 - testing getter', function () {
            assert.equal(6, average2.getAvr());
        });
        
        // Pushing second testing number: 4
        it('should return 5 - if we push another number 4', function () {
            assert.equal(5, average2.update(4));
        });
        it('should return 2 - testing updatingCount', function () {
            assert.equal(2, average2.updateCount);
        });
        it('should return 5 - testing getter', function () {
            assert.equal(5, average2.getAvr());
        });
    })
})
