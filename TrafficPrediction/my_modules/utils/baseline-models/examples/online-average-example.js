var sleep = require('sleep')
var onlineAvr = require('../online-average.js')
var onlineAvrAsync = require('../online-average-async.js')

//////// ONLINE AVERAGE  ////////
console.log("\n=== Online Average ===")

var average = new onlineAvr();
var average2 = new onlineAvr();

console.log("average.update(5):", average.update(5))
console.log("average.update(3):", average.update(3))

console.log("average2.update(6):", average2.update(6))
console.log("average2.update(4):", average2.update(4))

//////// ONLINE AVERAGE ASYNC ////////
console.log("\n=== Online Average Async ===")

var averageAsync = new onlineAvrAsync();
var averageAsync2 = new onlineAvrAsync();

averageAsync.update(5, function (err, avr) {
    if (err) { throw err; }
    console.log("averageAsync.update(5):", avr)
})

averageAsync.update(3, function (err, avr) {
    if (err) { throw err; }
    console.log("averageAsync.update(3):", avr)
})

averageAsync2.update(6, function (err, avr) {
    if (err) { throw err; }
    console.log("averageAsync2.update(6):", avr)
})

averageAsync2.update(4, function (err, avr) {
    if (err) { throw err; }
    console.log("averageAsync2.update(4):", avr)
})

//console.log("average.update(5):")
//average.update(5, function () {
//    console.log("Finished..")
//});
//console.log("average.update(3):", average.update(3))

//console.log("average2.update(6):", average2.update(6))
//console.log("average2.update(4):", average2.update(4))