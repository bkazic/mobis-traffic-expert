var SpecialDates = require('../special-dates.js');

//var SlovenianHolidays = new SpecialDates('Slovenian_holidays')
//var FoolMoon = new SpecialDates('Full_moon')

var SlovenianHolidays = SpecialDates.newSpecialDates('Slovenian_holidays');
var GreekHolidays = SpecialDates.newSpecialDates('Greek_holidays');
var FoolMoon = SpecialDates.newSpecialDates('Full_moon');

var CalendarFtrs = SpecialDates.newCalendarFeatures();
