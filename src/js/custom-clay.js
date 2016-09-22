module.exports = function(minified) {
	var clayConfig = this;
	var $ = minified.$;

	var allStops = clayConfig.meta.userData.stops;
	var allRoutes = clayConfig.meta.userData.routes;
	var actualStopsID = [];
	var routeIndex;
	var isRebuit = false;

	var getActualStops = function(actualStopsID) {
		var actualStops = [];
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

		clayConfig.config[2].items[2].options = stopsArray; 

		clayConfig.build();
		isRebuit = true;
		clayConfig.getItemByMessageKey("select_route").set(routeIndex);
	}

	clayConfig.on(clayConfig.EVENTS.AFTER_BUILD, function() {
		var routesSelect = clayConfig.getItemByMessageKey("select_route");
		routesSelect.on("change", function() {
			if (!isRebuit) {
				routeIndex = parseInt(routesSelect.get());
				var actualStopsID;
				for (var i = 0; i < allRoutes.length; i++) {
					if (allRoutes[i].id == routeIndex) {
						actualStopsID = allRoutes[i].stops;
						break;
					}
				}
				getActualStops(actualStopsID);
			}
			isRebuit = false;
		});
	});
};