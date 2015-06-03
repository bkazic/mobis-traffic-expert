// I had to use bind in the bellow functions.
// Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind

function setup(app, handlers) {

    app.get('/', handlers.service.handleGetRouterPaths.bind(handlers.service));
    app.get('/close-base', handlers.service.handleCloseBase.bind(handlers.service));

    app.get('/traffic-predictions/get-store-list', handlers.trafficPrediction.handleGetStoreList.bind(handlers.trafficPrediction));
    app.get('/traffic-predictions/get-sensors', handlers.trafficPrediction.handleGetSensors.bind(handlers.trafficPrediction));

    app.get('/traffic-predictions', handlers.trafficPrediction.handleGetTrafficPredictions.bind(handlers.trafficPrediction));
    app.get('/traffic-predictions/:id', handlers.trafficPrediction.handleGetTrafficPredictionsById.bind(handlers.trafficPrediction));
    
    // If you want to test from Simple REST Client, make sure you add in headers: Content-Type: application/json
    app.post('/traffic-predictions/add', handlers.trafficPrediction.handleAddMeasurement.bind(handlers.trafficPrediction));

}

exports.setup = setup;