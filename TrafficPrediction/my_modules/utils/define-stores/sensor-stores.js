var qm = require('qminer');
var path = require('path');

createSensorsStore = function (base) {
    var storeDef = {
        "name": "sensorsStore",
        "fields": [
            { "name": "pathId", "type": "float", "primary": true },
            { "name": "pathName", "type": "string", "null": true },
            { "name": "origin", "type": "float", "null": true },
            { "name": "destination", "type": "float", "null": true }
        ]
    }
    
    base.createStore(storeDef);
    qm.load.jsonFile(base.store('sensorsStore'), path.join(__dirname , '../../../sandbox//sensors.json'));
    
    return base.store("sensorsStore")
}

createMeasurementStores = function (base) {
    
    var stores = {
        rawStores: [],
        resampledStores: [],
        evaluationStores: [],
        predictionStores: []
    }
    
    var createStores = function (id) {
            
        var rawStoreNm = "rawStore_" + id;
        var resampledStoreNm = "resampledStore_" + id;
        var evaluationStoreNm = "evaluationStore_" + id;
        var predictionStoreNm = "predictionStore_" + id;
        
        var storeDef = [
            {
                "name": rawStoreNm,
                "fields": [
                    { "name": "DateTime", "type": "datetime", "primary": true },
                    { "name": "TravelTime", "type": "float", "null": true },
                    { "name": "AverageSpeed", "type": "float", "null": true }
                ],
                "joins": [
                    { "name": "Sensor", "type": "field", "store": "sensorsStore" },
                    { "name": "Predictions", "type": "index", "store": predictionStoreNm }
                ]
            },
            {
                "name": resampledStoreNm,
                "fields": [
                    { "name": "DateTime", "type": "datetime", "primary": true },
                    { "name": "TravelTime", "type": "float", "null": true },
                    { "name": "AverageSpeed", "type": "float", "null": true }
                ],
                "joins": [
                    { "name": "Sensor", "type": "field", "store": "sensorsStore" },
                    { "name": "Predictions", "type": "index", "store": predictionStoreNm }
                ]
            },
            {
                "name": evaluationStoreNm,
                "fields": [
                    { "name": "Name", "type": "string", "null": true },
                    { "name": "TravelTime", "type": "float", "null": true },
                    { "name": "AverageSpeed", "type": "float", "null": true }
                ]
            },	
            {
                "name": predictionStoreNm,
                "fields": [
                    { "name": "TravelTime", "type": "float", "null": true },
                    { "name": "AverageSpeed", "type": "float", "null": true },		        
                    { "name": "OriginalTime", "type": "datetime", "null": true }, //actual dateTime. When the prediction was made.
                    { "name": "PredictionTime", "type": "datetime", "null": true }, //actual dateTime. Cannot be primary because they will overlap. But you can try latter, because it woul be usefull that we could query them by time.
                    { "name": "PredictionHorizon", "type": "float", "null": true },
                    { "name": "UpdateCount", "type": "float", "null": true }
                ],
                "joins": [
                    { "name": "Evaluation", "type": "index", "store": evaluationStoreNm },
                    { "name": "Target", "type": "field", "store": resampledStoreNm }
                ]
            }
        ]

        base.createStore(storeDef)

        // saving instances in object which will be returned
        stores.rawStores[id] = base.store(rawStoreNm);
        stores.resampledStores[id] = base.store(resampledStoreNm);
        stores.evaluationStores[id] = base.store(evaluationStoreNm);
        stores.predictionStores[id] = base.store(predictionStoreNm);

    }
    
    if (base.store('sensorsStore') == null) { throw new Error("Store \'sensorsStore\' doesn't exist.") };
    
    base.store('sensorsStore').each(function (sensor) { createStores(sensor.pathId) })
    return stores;
}

exports.createSensorsStore = createSensorsStore;
exports.createMeasurementStores = createMeasurementStores;

