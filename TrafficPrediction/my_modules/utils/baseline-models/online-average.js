//////// ONLINE AVERAGE  ////////

// Constructor
var Average = function () {
    this.updateCount = 0;
    this.avr = 0;

    // if fin is defined, load it
    if (typeof fin !== 'undefined') this.load(fin);
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

// save current state
Average.prototype.save = function (fout) {
    fout.writeJson(this);
    return fout;
}

// load state
Average.prototype.load = function (fin) {
    var loadedState = fin.readJson();
    this.updateCount = loadedState.updateCount;
    this.avr = loadedState.avr;
    return fin;
}

// exports
module.exports = Average;