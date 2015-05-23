//////// ONLINE AVERAGE  ////////

// Constructor
var Average = function () {
    this.updateCount = 0;
    this.avr = 0;
}

// updating method
Average.prototype.update = function (val) {
    this.updateCount++;
    this.avr = this.avr + (val - this.avr) / this.updateCount;
    return this.avr;
}

// getter
Average.prototype.getAvr = function () {
    return this.avr;
}

// exports
module.exports = Average;