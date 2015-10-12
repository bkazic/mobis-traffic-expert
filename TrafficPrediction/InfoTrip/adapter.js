function transform(rec) {
    // transform rec data to InfoTrip format
    var transformedRec = {
        "forecasts": [{
                "pathId": rec.Sensor.pathId, 
                "statisticalForecastValue": +rec.Predictions[0].AverageSpeed.toFixed(1), 
                "timestamp": rec.Predictions[0].PredictionTime.toISOString()
            }], 
        "realValues": [{
                "pathId": rec.Sensor.pathId, 
                "realValue": rec.AverageSpeed, 
                "timestamp": rec.DateTime.toISOString()
            }]
    }

    return transformedRec;
};

exports.transform = transform;