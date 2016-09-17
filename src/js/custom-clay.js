module.exports = function(minified) {
	var clayConfig = this;
	var $ = minified.$;

	var allStops = clayConfig.meta.userData.stops;
	var allRoutes = clayConfig.meta.userData.routes;
	var actualStopsID = [];
	var actualStops = [];
	var routeIndex;
	var first = true;

	var getActualStops = function(actualStopsID) {
		for (var i = 0; i < allStops.length; i++) {
			if (actualStopsID.indexOf(allStops[i].id) != -1) {
				actualStops.push(allStops[i]);
			}
		}

		var stopsArray = [{"label": "", "value":""}];
		for (var i = 0; i < actualStops.length; i++) {
			var stop = { "label": actualStops[i].name, "value": actualStops[i].id};
			stopsArray.push(stop);
		}

		// var routesArray = [ {"label": "", "value": ""} ];
		// for (var i = 0; i < allRoutes.length; i++) {
		// 	var route = { "label": allRoutes[i].name, "value": i };
		// 	routesArray.push(route);
		// }

		// clayConfig.config[1].items[2].options = routesArray;
		clayConfig.config[2].items[2].options = stopsArray; 


		// getItemByMessageKey("select-stop").options = options;

		clayConfig.build();
		clayConfig.getItemByMessageKey("select_route").set(routeIndex);
	}

	clayConfig.on(clayConfig.EVENTS.AFTER_BUILD, function() {
		var routesSelect = clayConfig.getItemByMessageKey("select_route");
		routesSelect.on("change", function() {
			if (first) {
				first = false;
				routeIndex = parseInt(routesSelect.get());
				actualStopsID = allRoutes[routeIndex].stops;
				getActualStops(actualStopsID);
			}
		});
	});
};