/**
 * Copyright (c) 2015, Jozef Stefan Institute, Quintelligence d.o.o. and contributors
 * All rights reserved.
 * 
 * This source code is licensed under the FreeBSD license found in the
 * LICENSE file in the root directory of this source tree.
 */

var express = require('express');
var app = express();

function start() {
    // Create server with express
    app.get('/', function (req, res) {
        res.send('hello world');
        console.log('hello world');
    });
    
    var port = process.env.port || 1337;
    app.listen(port);
    console.log("Express server listening on port %d in %s mode", port, app.settings.env);
}

exports.start = start;
