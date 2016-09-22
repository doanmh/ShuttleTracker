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
	var xhrStops = new XMLHttpRequest();
	xhrStops.onload = function() {
		stopsArray = JSON.parse(this.responseText);
	};
	xhrStops.open("GET", stopsURL);
	xhrStops.send();
}();

var fetchRoutes = function() {
	var xhrRoutes = new XMLHttpRequest();
	xhrRoutes.onload = function() {
		routesArray = JSON.parse(this.responseText);
	};
	xhrRoutes.open("GET", routesURL);
	xhrRoutes.send();
}();

var getEstimate = function(stop, routeID) {
	var etaURL = "https://uc.doublemap.com/map/v2/eta?stop=" + stop.toString();
	xhrRequest(etaURL, "GET", function(responseText) {
		var parsedETA = JSON.parse(responseText);
		if (parsedETA.etas[stop].etas.length == 0) {
			var estimate = -1;
		} else {
			var estimates = parsedETA.etas[stop].etas;
			var estimate;
			for (var i = 0; i < estimates.length; i++) {
				if (estimates[i].route == routeID) {
					estimate = estimates[i].avg;
					break;
				} 
			}
		}
		
		var routeName;
		for (var i = 0; i < routesArray.length; i++) {
			if (routesArray[i].id == routeID) {
				routeName = routesArray[i].name;
				break;
			}
		}

		var stopName;
		for (var i = 0; i < stopsArray.length; i++) {
			if (stopsArray[i].id == stop) {
				stopName = stopsArray[i].name;
				break;
			}
		}

		console.log(stopName);

		var dictionary = {
			"ARRIVALTIME" : estimate,
			"ROUTENAME": routeName,
			"STOPNAME": stopName
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
			var option = { "label": routesArray[i].name, "value": routesArray[i].id };
			options.push(option);
		}
	});
	return options
}

var getStopsSelection = function(routeID) {
	var stops = [{"label": "", "value":""}];
	xhrRequest(routesURL, "GET", function(response) {
		var routes = JSON.parse(response);
		
		var actualStopsID;
		for (var i = 0; i < routes.length; i++) {
			if (routes[i].id == routeID) {
				actualStopsID = routes[i].stops;
				break;
			}
		}

		var actualStops = [];

		for (var i = 0; i < stopsArray.length; i++) {
			if (actualStopsID.indexOf(stopsArray[i].id) != -1) {
				actualStops.push(stopsArray[i]);
			}
		}

		for (var i = 0; i < actualStops.length; i++) {
			var stop = { "label": actualStops[i].name, "value": actualStops[i].id};
			stops.push(stop);
		}
	});
	

	return stops;
}

Pebble.addEventListener("ready", function(e) {
	clayConfig[2].items[1].options = getRoutesSelection();

	var chosenStop = localStorage.getItem('chosenStop');
	var chosenRoute = localStorage.getItem('chosenRoute');

	if (chosenStop && chosenRoute) {
		getEstimate(chosenStop, chosenRoute);
		clayConfig[2].items[1].defaultValue = chosenRoute; 
		clayConfig[2].items[2].options = getStopsSelection(chosenRoute);
	} else {
		clayConfig[2].items[1].defaultValue = ""; 
	}

	setInterval(function() {
		chosenStop = localStorage.getItem('chosenStop');
		chosenRoute = localStorage.getItem('chosenRoute');
		getEstimate(chosenStop, chosenRoute);
	}, 30000)

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

	var res = JSON.parse(e.response);

	var stop = res.select_stop.value;
	var route = res.select_route.value;

	localStorage.setItem('chosenStop', stop);
	localStorage.setItem('chosenRoute', route);

	getEstimate(stop, route);

	clayConfig[2].items[2].options = getStopsSelection(route);

	var dict = clay.getSettings(e.response)

	Pebble.sendAppMessage(dict, function(e) {
		console.log('Sent config data to Pebble');
	}, function (e) {
		console.log('Failed to send config data!');
		console.log(JSON.stringify(e));
	});
});