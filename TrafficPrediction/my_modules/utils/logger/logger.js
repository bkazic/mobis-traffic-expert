var winston = require('winston');
var path = require('path');
var fs = require('fs');
var env = process.env.NODE_ENV || 'development';
var config = require('../../../config.json')[env];

// Check if logs folder exists. If not, create it.
var dir = './server/logs';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

//REF: http://tostring.it/2014/06/23/advanced-logging-with-nodejs/

winston.emitErrs = true;
var logger = new winston.Logger({
    transports: [
        new winston.transports.DailyRotateFile({
            name: 'file.all',
            level: 'info', 
            datePattern: '.yyyy-MM-dd',
            filename: './server/logs/all-logs.log',
            handleExceptions: true,
            zippedArchive: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false
        }),
        new winston.transports.DailyRotateFile({
            name:'file.error',
            level: 'error', 
            datePattern: '.yyyy-MM',
            filename: './server/logs/error-logs.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false
        }),
        new winston.transports.Console({
            //level: 'debug', // Delete this later if everything is ok
            //level: 'error', // Delete this later if everything is ok
            level: config.logger.console.level,
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

module.exports = logger;
module.exports.stream = {
    write: function (message, encoding) {
        logger.info(message);
    }
};