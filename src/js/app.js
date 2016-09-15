var Clay = require('pebble-clay');
var clayConfig = require('./config');
var customClay = require('./custom-clay');
var clay = {};

var busesURL = "https://uc.doublemap.com/map/v2/buses";
var routesURL = "https://uc.doublemap.com/map/v2/routes";
var stopsURL = "https://uc.doublemap.com/map/v2/stops";

var isReady = false;

var xhrRequest = function(url, type, callback) {
	var xhr = new XMLHttpRequest();
	xhr.onload = function() {
		callback(this.responseText);
	};
	xhr.open(type, url);
	xhr.send();
}


var fetchStops = function() {
	var stops = [];
	xhrRequest(stopsURL, "GET", function(response) {
		stops = JSON.parse(response);
	});
	return stops;
}

var fetchRoutes = function() {
	var routes = [];
	xhrRequest(routesURL, "GET", function(response) {
		routes = JSON.parse(response);
	});
	return routes;
}

var getEstimate = function(stop) {
	var etaURL = "https://uc.doublemap.com/map/v2/eta?stop=" + stop.toString();
	xhrRequest(etaURL, "GET", function(responseText) {
		var parsedETA = JSON.parse(responseText);
		if (parsedETA.etas[stop].etas.length == 0) {
			var estimate = 15;
		} else {
			var estimate = parsedETA.etas[stop].etas[0].avg;
		}
		
		var dictionary = {
			"ARRIVALTIME" : estimate
		}

		Pebble.sendAppMessage(dictionary,
			function(error) {
				console.log("Success!");
			},
			function(error) {
				console.log("Error!");
			}
		);

		console.log(estimate);
	});
}

var getRoutesSelection = function(routesArray) {
	var options = [ {"label": "", "value": ""} ];
	xhrRequest(routesURL, "GET", function(response) {
		var routesArray = JSON.parse(response);
		for (var i = 0; i < routesArray.length; i++) {
			var option = { "label": routesArray[i].name, "value": i };
			options.push(option);
		}
	});
	return options
}

Pebble.addEventListener("ready", function(err) {
	isReady = false;
	console.log("PebbleKitJS is ready!");
	var routesArray = fetchRoutes();
	var stopsArray = fetchStops();
	var userData = {routes: routesArray, stops: stopsArray};
	clayConfig[2].items[1].options = getRoutesSelection(routesArray);
	clay = new Clay(clayConfig, customClay, {autoHandleEvents: false, userData: userData}); 
	isReady = true;
	getEstimate(103);
});

Pebble.addEventListener("appmessage", function(err) {
	console.log("AppMessage received!");

	getEstimate(103);
});

Pebble.addEventListener('showConfiguration', function(err) {
	if (isReady) {
		clay.config = clayConfig;
		Pebble.openURL(clay.generateUrl());
		console.log("Configuration showed");
	}
});

Pebble.addEventListener('webviewclosed', function(err) {
	if (err && !err.response) {
		return;
	}

	var dict = clay.getSettings(err.response)

	Pebble.sendAppMessage(dict, function(err) {
		console.log('Sent config data to Pebble');
	}, function (err) {
		console.log('Failed to send config data!');
		console.log(JSON.stringify(err));
	});
});