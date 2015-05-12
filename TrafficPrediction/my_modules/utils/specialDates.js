// Import modules
var qm = require('qminer');

// Format date to Date string
Date.prototype.getDateString = function () {
    var year = this.getFullYear();
    var month = ("0" + (this.getMonth() + 1)).slice(-2)
    var day = ("0" + this.getDate()).slice(-2)
    return String(year + "-" + month + "-" + day)
}

// This will be the main object
SpecialDatesFtrExtractor = function (base, path, key, store) {
    if (typeof base === 'undefined') {
        // throw exception
    }

    if (base.store('specialDates') == null) {
        // create store definition
        var storeDef = [{
                "name": "specialDates",
                "fields": [
                    { "name": "Key", "type": "string" },
                    { "name": "DateString", "type": "string" }
                ],
                "keys": [
                    { "field": "Key", "type": "value" },
                    { "field": "DateString", "type": "value" }
                ]
            }];
        base.createStore(storeDef);
    }
    
    // Load store from file in sandbox
    this.specialDatesFilePath = path
    qm.load.jsonFile(base.store("specialDates"), this.specialDatesFilePath);

    this.store = typeof store !== 'undefined' ? store : base.store("specialDates");
    this.key = key;
    // check if key exists
    if (base.search({ $from: this.store.name, Key: key }).length == 0) {
        throw new Error('key in specialDaysFtrExtractor not found.')
    };
};

SpecialDatesFtrExtractor.prototype.getFeature = function (rec) {
    recDate = rec.DateTime.getDateString();
    var recs = base.search({ $from: this.store.name, Key: this.key, DateString: recDate });
    return recs.length !== 0 ? 1 : 0;
}

SpecialDatesFtrExtractor.prototype.getTmFtrs = function (rec) {
    var h = rec.DateTime.getUTCHours(); 
    var d = rec.DateTime.getUTCDay(); 
    var m = rec.DateTime.getUTCMonth(); 
    return new qm.la.Vector([h, d, m])
}

SpecialDatesFtrExtractor.prototype.getCyclicTmFtrs = function (rec) {
    var ch = Math.cos(2 * Math.PI * rec.DateTime.getUTCHours() / 24); // can be with Math.sin() also
    var cd = Math.cos(2 * Math.PI * rec.DateTime.getUTCDay() / 7); // can be with Math.sin() also
    var cm = Math.cos(2 * Math.PI * rec.DateTime.getUTCMonth() / 12); // can be with Math.sin() also
    return new qm.la.Vector([ch, cd, cm])
}

SpecialDatesFtrExtractor.prototype.isWeekend = function (rec) {
    return (rec.DateTime.getUTCDay() == 0 || rec.DateTime.getDay() == 6) ? 1 : 0;
}

SpecialDatesFtrExtractor.prototype.isWorkingDay = function (rec) {
    return (this.isWeekend(rec) || this.getFeature(rec) === 1) ? 0 : 1;
}

// Exports
exports.SpecialDatesFtrExtractor = SpecialDatesFtrExtractor;

// About this module
exports.about = function () {
    var description = "Module contains functions for special days feature extractors defined in specialDays.txt.";
    return description;
};