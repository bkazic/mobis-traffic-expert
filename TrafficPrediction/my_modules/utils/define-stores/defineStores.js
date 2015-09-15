var qm = require('qminer');

function createSchema(id) {
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
                { "name": "AverageSpeed", "type": "float", "null": true },
                { "name": "Origin", "type": "float", "null": true }
            ],
            "joins": [
                { "name": "Predictions", "type": "index", "store": predictionStoreNm }
            ]
        },
        {
            "name": resampledStoreNm,
            "fields": [
                { "name": "DateTime", "type": "datetime", "primary": true },
                { "name": "TravelTime", "type": "float", "null": true },
                { "name": "AverageSpeed", "type": "float", "null": true },
                { "name": "Origin", "type": "float", "null": true }
            ],
            "joins": [
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
    return storeDef;
}

function createStores(base, id) {
    var storeDef = createSchema(id);

    var rawStoreNm = "rawStore_" + id;
    var resampledStoreNm = "resampledStore_" + id;
    var evaluationStoreNm = "evaluationStore_" + id;
    var predictionStoreNm = "predictionStore_" + id;

    var stores = {
        rawStores: [],
        resampledStores: [],
        evaluationStores: [],
        predictionStores: []
    }
    
    // create stores
    base.createStore(storeDef);
    
    // saving instances in object which will be returned
    stores.rawStores[id] = base.store(rawStoreNm);
    stores.resampledStores[id] = base.store(resampledStoreNm);
    stores.evaluationStores[id] = base.store(evaluationStoreNm);
    stores.predictionStores[id] = base.store(predictionStoreNm);

    return stores;
}

exports.createStores = createStores;

// Usage
// var stores = require("lala")
// var storesGen = new stores.StoreGenerator(base)
// storesGen.generateStores("id98");

// Usage2
// var stores = require("lala")
// stores.generateStores(base, "id98")
