// REF: http://stackoverflow.com/questions/6898779/how-to-write-asynchronous-functions-for-node-js
// REF: https://vimeo.com/19519289


//var async_function = function (val, callback) {
//    process.nextTick(function () {
//        callback(val);
//    });
//};

//async_function(42, function (val) {
//    console.log(val)
//});
//console.log(43);

//var update = function (num, callback) {
//    process.nextTick(function () {
//        var res = num + 100;
//        callback(res)
//    })
//}


var Test = function () {
    this.num = 0;
    this.count = 0;
}

Test.prototype.update = function (num, callback) {
    console.log("TEST:", this.count)
    var self = this;
    process.nextTick(function () {
        console.log("TEST:", self.count)
        self.count++
        self.num = (num + 100) / self.count;
        return callback(self.num)
    })
}


//update(42);

//var update = function (num, callback) {
//    async_function(num, callback)
//}

var bu = new Test()

bu.update(42, function (result) {
    console.log("Hey man i'm done here! \nResult:", result);
});


console.log(43);
console.log(bu.num)