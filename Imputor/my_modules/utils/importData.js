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
    //var dateTimeFields = getDateTimeFieldNames(loadStores);

    var respCallBack = function (resp) {
        var lowestRecIdx = findLowestRecIdx(currRecIdxs);
        try {
            var rec = loadStores[lowestRecIdx].recs[currRecIdxs[lowestRecIdx]]
        } catch (err) {
            throw "Reached to the end"
        }
        //var val = rec.toJSON(true);
        
        var val = rec.toJSON();
        delete val.$id;
        val["measuredBy"] = { "Name": rec.measuredBy.Name };
        
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
                console.log("Reached count limit at " + limit);
                throw "Reached count limit at " + limit
                return;
            } else count++
        }
        
        var data = (_data == null) ? null : JSON.stringify(_data);
        console.log("Sending data...\n" + JSON.stringify(_data, undefined, 2));
        //debugger;

        request.post(url, { json: _data }, function (err, res, body) {
            if (err) {
                throw new Error(err);
                sendData();
            }

            console.log("Response: " + JSON.stringify(body));
            respCallBack(res);
            
        })

        //currRecIdxs[lowestRecIdx]++
    }
    
    sendData() //Start the process // I think this can be replaced with ()
}

// About this module
exports.about = function () {
    var description = "Imports data according to timestamp. Instore and outstore are input parameters.";
    return description;
};