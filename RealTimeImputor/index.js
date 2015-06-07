var TrafficRetriever = require('./my_modules/retrievers/TrafficRetriever.js');

var interval = 60*1000//5sec for debuging
var trafficRetriever = new TrafficRetriever("http://opendata.si/promet/counters/");

// Main process
(function startFetching() {
    
    trafficRetriever.fetchData(function (err, data) {
        if (err) throw err;
        console.log("Recieved new record: " + data.feed.title);
    });

    setTimeout(startFetching, interval)
})();