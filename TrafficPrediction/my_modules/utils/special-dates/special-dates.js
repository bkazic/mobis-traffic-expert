var qm = require('qminer');
var path = require('path');

//// CLEAN AND CREATE
//var base = new qm.Base({
//    mode: 'createClean',
//    schema: [{
//        name: "specialDates",
//        fields: [
//            { name: "Key", type: "string" },
//            { name: "DateString", type: "string" }
//        ],
//        keys: [
//            { field: "Key", type: "value" },
//            { field: "DateString", type: "value" }
//        ]
//    }],
//    dbPath: path.join(__dirname, './db') 
//});
//qm.load.jsonFile(base.store("specialDates"), path.join(__dirname , '/specialDates.txt'))
//base.close()


// READ ONLY
var base = new qm.Base({
    mode: 'openReadOnly',
    schema: [{
            name: "specialDates",
            fields: [
                { name: "Key", type: "string" },
                { name: "DateString", type: "string" }
            ],
            keys: [
                { field: "Key", type: "value" },
                { field: "DateString", type: "value" }
            ]
        }],
    dbPath: path.join(__dirname, './db') 
});


// Constructor
var SpecialDates = function (key, store) {
    this.store = typeof store !== 'undefined' ? store : base.store("specialDates");
    this.key = key;
    // check if key exists
    if (base.search({ $from: this.store.name, Key: key }).length == 0) {
        throw new Error('key in specialDaysFtrExtractor not found.')
    };
};

SpecialDates.prototype.getFeature = function (rec) {
    recDate = rec.DateTime.getDateString();
    var recs = base.search({ $from: this.store.name, Key: this.key, DateString: recDate });
    return recs.length !== 0 ? 1 : 0;
}


Date.prototype.getDateString = function () {
    var year = this.getFullYear();
    var month = ("0" + (this.getMonth() + 1)).slice(-2)
    var day = ("0" + this.getDate()).slice(-2)
    return String(year + "-" + month + "-" + day)
}

// Constructor
var CalendarFeatures = function () {
    //this.Holidays = new SpecialDates('Slovenian_holidays');
    this.Holidays = new SpecialDates('Greek_holidays'); // if it is used in Greek usecase
}

CalendarFeatures.prototype.getCalFtrs = function (rec) {
    var h = rec.DateTime.getUTCHours(); 
    var d = rec.DateTime.getUTCDay(); 
    var m = rec.DateTime.getUTCMonth(); 
    return new qm.la.Vector([h, d, m])
}

CalendarFeatures.prototype.getCyclicCalFtrs = function (rec) {
    var ch = Math.cos(2 * Math.PI * rec.DateTime.getUTCHours() / 24); // can be with Math.sin() also
    var cd = Math.cos(2 * Math.PI * rec.DateTime.getUTCDay() / 7); // can be with Math.sin() also
    var cm = Math.cos(2 * Math.PI * rec.DateTime.getUTCMonth() / 12); // can be with Math.sin() also
    return new qm.la.Vector([ch, cd, cm])
}

CalendarFeatures.prototype.isWeekend = function (rec) {
    return (rec.DateTime.getUTCDay() == 0 || rec.DateTime.getDay() == 6) ? 1 : 0;
}

CalendarFeatures.prototype.isWorkingDay = function (rec) {
    return (this.isWeekend(rec) || this.Holidays.getFeature(rec) === 1) ? 0 : 1;
}

//module.exports = SpecialDates;
exports.newSpecialDates = function (key, store) { return new SpecialDates(key, store); }

exports.newCalendarFeatures = function () { return new CalendarFeatures(); }
