var request = require('request');

exports.importData = function (url, inStores, outStores, limit) {
   
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
            var currRec = loadStores[ii].allRecords[currRecIdxs[ii]];
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
    //var dateTimeFields = getDateTimeFieldNames(loadStores);

    var respCallBack = function (resp) {
        var lowestRecIdx = findLowestRecIdx(currRecIdxs);
        try {
        var rec = loadStores[lowestRecIdx].allRecords[currRecIdxs[lowestRecIdx]]
        } 
        catch (err) {
            request.post(url, { json: { message: "[IMPUTOR] Finished importing data." } }, function (err, res, body) {
                console.log("\n[IMPUTOR] Finished importing data.");
                console.log("Response: " + JSON.stringify(body));
            });
            //console.log("[IMPUTOR]  Finished importing data.");
            //throw "Reached to the end"
            return;
        }
        //var val = rec.toJSON(true);
        
        var val = rec.toJSON();
        delete val.$id;
        //val["measuredBy"] = { "Name": rec.measuredBy.Name };
        
        //console.log("Response: " + JSON.stringify(resp));
        
        sendData(val);
        currRecIdxs[lowestRecIdx]++
    }
    
    var sendData = function (_data) {
        //Check if there is any rec left
        var lowestRecIdx = findLowestRecIdx(currRecIdxs);
        if (lowestRecIdx == -1) { return; }
        
        // If input parameter limit is defined
        if (limit != null) {
            if (count > limit) {
                console.log("[IMPUTOR] Reached count limit at " + limit);
                request.post(url, { json: { message: "[IMPUTOR] Reached count limit at " + limit } })
                //throw "Reached count limit at " + limit
                return;
            } else count++
        }
        
        console.log("\n[IMPUTOR] Sending data: " + JSON.stringify(_data, undefined, 2));
        
        // If you want to test from Simple REST Client, make sure you add in headers: Content-Type: application/json and then Data: {"test": "test"}
        request.post(url, { json: _data }, function (err, res, body) {
            if (err) {
                console.error("[Error] Response: ", JSON.stringify(err));
                console.log("[IMPUTOR] Resending data");
                sendData(_data);
                return; // You do not want to return here with real data?
            }
            
            console.log("Response: " + JSON.stringify(body));
            respCallBack(res);
            
        })

        //currRecIdxs[lowestRecIdx]++
    }
    sendData();
}

// About this module
exports.about = function () {
    var description = "Imports data according to timestamp. Instore and outstore are input parameters.";
    return description;
};