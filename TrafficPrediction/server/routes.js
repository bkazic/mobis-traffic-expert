// I had to use bind in the bellow functions.
// Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind

var auth = require('./auth.js');

function setup(app, handlers) {

    // http://mustang.ijs.si:9570/
    app.get('/', handlers.service.handleGetRouterPaths.bind(handlers.service));
    // http://mustang.ijs.si:9570/close-base
    app.get('/close-base', auth, handlers.service.handleCloseBase.bind(handlers.service));    
    
    // http://mustang.ijs.si:9570/get-store-list
    app.get('/get-store-list', auth, handlers.service.handleGetStoreList.bind(handlers.service));
    // http://mustang.ijs.si:9570/get-store-recs/predictionStores?limit=20 // limit is optional param to limit the size of output
    app.get('/get-store-recs/:store', auth, handlers.service.handleGetStoreRecs.bind(handlers.service));
    
    // http://mustang.ijs.si:9570/traffic-predictions/get-sensors
    app.get('/traffic-predictions/get-sensors', handlers.trafficPrediction.handleGetSensors.bind(handlers.trafficPrediction));
    
    // http://mustang.ijs.si:9570/traffic-predictions
    app.get('/traffic-predictions', handlers.trafficPrediction.handleGetTrafficPredictions.bind(handlers.trafficPrediction));
    // http://mustang.ijs.si:9570/traffic-predictions/0855-11
    app.get('/traffic-predictions/:id', handlers.trafficPrediction.handleGetTrafficPredictionsById.bind(handlers.trafficPrediction));
    
    // http://mustang.ijs.si:9570/traffic-predictions/add
    // If you want to test from Simple REST Client, make sure you add in headers: Content-Type: application/json
    app.post('/traffic-predictions/add', handlers.trafficPrediction.handleAddMeasurement.bind(handlers.trafficPrediction));

}

exports.setup = setup;