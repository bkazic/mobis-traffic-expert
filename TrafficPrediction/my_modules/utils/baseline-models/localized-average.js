var OnlineAverage = require('./online-average.js')
var SpecialDates = require('../special-dates/special-dates.js');

var CalendarFtrs = SpecialDates.newCalendarFeatures();

//////// LOCALIZED AVERAGE  ////////
// Constructor
var LocalizedAverages = function (conf) {
    var field = conf.fields;
    this.fieldNm = field.name;
    this.avrgs = createLocalizedAvrgs();
}
    
LocalizedAverages.prototype.update = function (rec) {
    var avr = selectAvr(rec);
    return avr.update(rec[this.fieldNm])
}
    
LocalizedAverages.prototype.getVal = function (rec) {
    var avr = selectAvr(rec);
    return avr.getAvr()
}

// helper function
var createLocalizedAvrgs = function () {
    // create 2 * 24 avr models, for every hour, and for working/nonworking day
    avrgs = [];
    for (var i = 0; i < 2; i++) { // 2 models: working day or not
        avrgs[i] = [];
        for (var j = 0; j < 24; j++) {
            avrgs[i][j] = new OnlineAverage();
            avrgs[i][j]["forHour"] = j; // asign new field "forHour" to model
        }
    }
    return avrgs;
};

var selectAvr = function (rec) {
    var hour = rec.DateTime.getUTCHours();
    var work = CalendarFtrs.isWorkingDay(rec);
    
    return this.avrgs[work][hour];
}

module.exports = LocalizedAverages;

//exports.newLocAvrgs = function (conf) {

//    var field = conf.fields;

//    var hours = (conf.includeHours == true) ? true : false;
//    var days = (conf.includeDaysOfWeek == true) ? true : false;
//    var working = (conf.includeWorkingDays == true) ? true : false;

//    return new locAvrgs(field, hours, days, working);
//}

// About this module
//exports.about = function () {
//    var description = "Module with baseline predictions.";
//    return description;
//};