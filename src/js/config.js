module.exports = [
	{
		"type": "heading",
		"defaultValue": "APP CONFIGURATION",
		"id": "heading"
	},
	{
		"type": "text",
		"defaultValue": "Choose your route and the stop you're at.",
		"id": "text"
	},
	{
		"type": "section",
		"items": [
			{
				"type": "heading",
				"defaultValue": "Route & Stop"
			},
			{
				"type": "select",
				"defaultValue": "",
				"label": "Choose Route",
				"messageKey": "select-route",
				"id": "routeList",
				"options": [
					
				]
			},
			{
				"type": "select",
				"defaultValue": "",
				"label": "Choose Stop",
				"messaageKey": "select-stop",
				"id": "stopList",
				"options": [

				]
			}
		]
	},
	{
		"type": "submit",
		"defaultValue": "Save Settings"
	}
];