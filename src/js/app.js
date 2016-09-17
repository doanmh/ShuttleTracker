var Clay = require('pebble-clay');
var clayConfig = require('./config');
var customClay = require('./custom-clay');
var clay = new Clay(clayConfig, customClay, {autoHandleEvents: false, userData: {}});

var busesURL = "https://uc.doublemap.com/map/v2/buses";
var routesURL = "https://uc.doublemap.com/map/v2/routes";
var stopsURL = "https://uc.doublemap.com/map/v2/stops";
var routesArray = [];
var stopsArray = [];
var userData = {};

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
		arr = JSON.parse(response);
		for (var i = 0; i < arr.length; i++) {
			stops.push(arr[i]);
		}
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

var getRoutesSelection = function() {
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

Pebble.addEventListener("ready", function(e) {
	var xhrRoutes = new XMLHttpRequest();
	xhrRoutes.onload = function() {
		routesArray = JSON.parse(this.responseText);
	};
	xhrRoutes.open("GET", routesURL);
	xhrRoutes.send();

	var xhrStops = new XMLHttpRequest();
	xhrStops.onload = function() {
		stopsArray = JSON.parse(this.responseText);
	};
	xhrStops.open("GET", stopsURL);
	xhrStops.send();

	clayConfig[2].items[1].options = getRoutesSelection();

	console.log("PebbleKitJS is ready!");
});

Pebble.addEventListener("appmessage", function(e) {
	console.log("AppMessage received!");
});

Pebble.addEventListener('showConfiguration', function(e) {
	userData = {routes: routesArray, stops: stopsArray};
	clay.meta.userData = userData;
	clay.config = clayConfig;
	Pebble.openURL(clay.generateUrl());
	console.log("Configuration showed");
});

Pebble.addEventListener('webviewclosed', function(e) {
	if (e && !e.response) {
		return;
	}

	var stop = JSON.parse(e.response).select_stop.value;

	getEstimate(stop);

	var dict = clay.getSettings(e.response)

	Pebble.sendAppMessage(dict, function(e) {
		console.log('Sent config data to Pebble');
	}, function (e) {
		console.log('Failed to send config data!');
		console.log(JSON.stringify(e));
	});
});