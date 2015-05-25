exports.importData = function (inStores, outStores, limit) {
   
    var loadStores = inStores;
    var targetStores = outStores;
    var count = 0; //counter used for counting iterations when limit is defined
    
    /*
    console.log('Importing data from  %s to %s...', 
        inStores.map(function (store) { return store.name }), 
        outStores.map(function (store) { return store.name }))
    */

    // Find and returns first datetime field from store
    getDateTimeFieldName = function (store) {
        var dateTimeFieldName = null;
        for (var ii = 0; ii < store.fields.length; ii++) {
            if (store.fields[ii].type == "datetime") {
                dateTimeFieldName = store.fields[ii].name;
                break;
            }
        }
        return dateTimeFieldName;
    };
    
    // Find and returns all datetime fields in store
    getDateTimeFieldNames = function (stores) {
        var result = []
        for (var ii = 0; ii < stores.length; ii++) {
            var store = stores[ii];
            result.push(getDateTimeFieldName(store));
        }
        return result;
    };
    
    // Returns index with lowest timestamp value from currRecIdxs array
    findLowestRecIdx = function (currRecIdxs) {
        var min = Number.MAX_VALUE;
        var idx = -1;
        var dateTimeFields = getDateTimeFieldNames(loadStores);
        
        for (var ii = 0; ii < currRecIdxs.length; ii++) {
            var currRec = loadStores[ii].recs[currRecIdxs[ii]];
            if (currRec == null) continue;
            if (currRec[dateTimeFields[ii]].getTime() < min) {
                min = currRec[dateTimeFields[ii]].getTime();
                idx = ii;
            }
        }
        return idx;
    };
    
    var currRecIdxs = [];
    for (var ii = 0; ii < loadStores.length; ii++) {
        currRecIdxs.push(0);
    }
    //var lowestRecIdx = findLowestRecIdx(currRecIdxs);
    var dateTimeFields = getDateTimeFieldNames(loadStores);
    while (true) {
        var lowestRecIdx = findLowestRecIdx(currRecIdxs);
        if (lowestRecIdx == -1) break;
        
        // If input parameter limit is defined
        if (limit != null) {
            if (count > limit) {
                console.log("Reached count limit at " + limit)
                break;
            } else count++
        }
        
        var rec = loadStores[lowestRecIdx].recs[currRecIdxs[lowestRecIdx]]
        
        // If outStores is "", we have to find appropriate store according to id
        if (targetStores === "") {
            id = rec.measuredBy.Name.replace("-", "_");
            trafficStore = rec.store.base.store("trafficStore_" + id);
            
            //console.log("Getting rec with id: " + id + ", Timestamp: " + rec.DateTime.toISOString());
            //console.log("Saving it to store: " + trafficStore.name);

            trafficStore.add(rec.toJSON(true));
        } else {
            targetStores[lowestRecIdx].add(rec.toJSON(true));
        }
        
        currRecIdxs[lowestRecIdx]++
    }
}

// About this module
exports.about = function () {
    var description = "Imports data according to timestamp. Instore and outstore are input parameters.";
    return description;
};