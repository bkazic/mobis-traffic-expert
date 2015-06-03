function setup(app, handlers) {
    app.get('/', handlers.service.getRouterPaths.bind(handlers.service));
    app.get('/close-base', handlers.service.closeBase.bind(handlers.service));
    //app.post('/add', TODO);

    app.get('/traffic-predictions', handlers.trafficPrediction.getTrafficPredictions.bind(handlers.trafficPrediction));
    //app.get('/traffic-predictions/:id', TODO);
    app.get('/traffic-predictions/get-store-list', handlers.trafficPrediction.getStoreList.bind(handlers.trafficPrediction));
    app.get('/traffic-predictions/get-sensors', handlers.trafficPrediction.getSensors.bind(handlers.trafficPrediction));
}

exports.setup = setup;