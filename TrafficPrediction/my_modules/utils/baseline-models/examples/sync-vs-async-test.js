var sleep = require('sleep')

//////// ONLINE AVERAGE  ////////

// Constructor
var OnlineAverage = function () {
    this.updateCount = 0;
    this.avr = 0;
}

// updating method
OnlineAverage.prototype.update = function (val) {
    sleep.sleep(1); // Simulate 1s dealy
    this.updateCount++;
    this.avr = this.avr + (val - this.avr) / this.updateCount;
    return this.avr;
}


//////// ONLINE AVERAGE ASYNC ////////

// Constructor
var OnlineAverageAsync = function () {
    this.updateCount = 0;
    this.avr = 0;
}

// updating method
OnlineAverageAsync.prototype.update = function (val, callback) {
    var self = this// otherwise .this is not known inside .nextTick
    process.nextTick(function () {
        sleep.sleep(1); // Simulate 1s delay
        self.updateCount++;
        self.avr = self.avr + (val - self.avr) / self.updateCount;
        return callback(null, self.avr); // first parameter is error
    });
}



////////// TEST //////////

var onlineAvr = new OnlineAverage()
var onlineAvrAsync = new OnlineAverageAsync()

var coll = [];
for (var i = 0; i < 5; i++) { coll.push(i) };


// Synchronous online average
console.log("\n=== Synchronous online average ===");
coll.forEach(function (i) {

    console.log("--> Starting Iter:", i)
    console.log("Iter: %d, Avr: %d", i, onlineAvr.update(i));
});


// Asynchronous online average
console.log("\n=== Asynchronous online average ===");
coll.forEach(function (val) {

    console.log("--> Starting Iter:", val);
    onlineAvrAsync.update(val, function (err, res) {
        console.log("Iter: %d, Avr: %d", val, res);
    });
});
