//////// ONLINE AVERAGE ASYNC ////////

// Constructor
var Average = function () {
    this.updateCount = 0;
    this.avr = 0;
}

// updating method
Average.prototype.update = function (val, callback) {
    var self = this// otherwise .this is not known inside .nextTick
    process.nextTick(function () {
        self.updateCount++;
        self.avr = self.avr + (val - self.avr) / self.updateCount;
        return callback(null, self.avr); // first parameter is error
    });
}

// getter
Average.prototype.getAvr = function () {
    return this.avr;
}

// exports
module.exports = Average;