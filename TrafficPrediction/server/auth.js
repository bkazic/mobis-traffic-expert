var basicAuth = require('basic-auth');
var env = process.env.NODE_ENV || 'development';
var config = require('../config.json')[env];
var logger = require("../my_modules/utils/logger/logger.js");

var auth = function (req, res, next) {
    function unauthorized(res) {
        logger.warn("Unauthorized request: %s %s!", req.method, req.url)
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.status(401).sendStatus(401);
    };
    
    var user = basicAuth(req);

    // This is the shortest version. Not sure which one is better.
    if (user && config.admins[user.name] && config.admins[user.name].password === user.pass) {
        return next();
    };
    return unauthorized(res);

};

module.exports = auth;

// Ref: https://davidbeath.com/posts/expressjs-40-basicauth.html
// Ref:http://stackoverflow.com/questions/23616371/basic-http-authentication-with-node-and-express-4