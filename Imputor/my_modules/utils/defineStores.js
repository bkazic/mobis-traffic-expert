var qm = require('qminer');
var path = require('path');

createSensorsStore = function (base) {
    var storeDef = [{
        "name": "sensorsStore",
        "fields": [
            { "name": "pathId", "type": "float", "primary": true },
            { "name": "pathName", "type": "string", "null": true },
            { "name": "origin", "type": "float", "null": true },
            { "name": "destination", "type": "float", "null": true }
        ]
    },
    {
        "name": "data",
        "fields": [
            { "name": "DateTime", "type": "datetime", "primary": true },
            { "name": "TravelTime", "type": "float", "null": true },
            { "name": "AverageSpeed", "type": "float", "null": true },
            { "name": "Count", "type": "float", "null": true }
        ],
        "joins": [
            { "name": "Sensor", "type": "field", "store": "sensorsStore"}
        ]
    }]
    
    base.createStore(storeDef);
    qm.load.jsonFile(base.store('sensorsStore'), path.join(__dirname , '../../sandbox//sensors.json'));
    
    return base.store("sensorsStore")
}

createMeasurementStores = function (base) {
    var stores = {
        rawStores: []
    }
    
    var createStores = function (id) {
        
        var rawStoreNm = "rawStore_" + id;
        
        var storeDef = [
            {
                "name": rawStoreNm,
                "fields": [
                    { "name": "DateTime", "type": "datetime", "primary": true },
                    { "name": "TravelTime", "type": "float", "null": true },
                    { "name": "AverageSpeed", "type": "float", "null": true },
                    { "name": "Count", "type": "float", "null": true}
                ],
                "joins": [
                    { "name": "Sensor", "type": "field", "store": "sensorsStore" },
                ]
            }
        ]
        
        base.createStore(storeDef)
        
        // saving instances in object which will be returned
        stores.rawStores[id] = base.store(rawStoreNm);
    }
    
    if (base.store('sensorsStore') == null) { throw new Error("Store \'sensorsStore\' doesn't exist.") }    ;
    
    base.store('sensorsStore').each(function (sensor) { createStores(sensor.pathId) })
    return stores;
}

exports.createSensorsStore = createSensorsStore;
exports.createMeasurementStores = createMeasurementStores;

