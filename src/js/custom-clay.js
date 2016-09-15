module.exports = function(minified) {
	var clayConfig = this;
	var $ = minified.$;

	var allStops = clayConfig.meta.userData.stops;
	var allRoutes = clayConfig.meta.userData.routes;
	var actualStopsID = [];
	var actualStops = [];

	var getActualStops = function(actualStopsID) {
		for (var i = 0; i < allStops.length; i++) {
			if (actualStopsID.indexOf(allStops[i].id) != -1) {
				actualStops.push(allStops[i]);
			}
		}
		clayConfig.getItemByMessageKey("select-stop").options = [{"label": "", "value":""}];
		for (var i = 0; i < allStops.length; i++) {
			var stop = { "label": actualStops[i].name, "value": actualStops[i].id};
			clayConfig.getItemByMessageKey("select-stop").options.push(stop);
		}

		clayConfig.build();
	}

	clayConfig.on(clayConfig.EVENTS.AFTER_BUILD, function() {
		var routesSelect = clayConfig.getItemByMessageKey("select-route");
		routesSelect.on("change", function() {
			var routeIndex = parseInt(routesSelect.get());
			clayConfig.getItemById("text").set(Object.keys(clayConfig.meta.userData));
			actualStopsID = allRoutes[routeIndex].stops;
			getActualStops(actualStopsID);
		});
	});
};