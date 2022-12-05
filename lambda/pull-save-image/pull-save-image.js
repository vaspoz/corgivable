const { Client, Events, GatewayIntentBits } = require("discord.js");

exports.handler = (event) => {
	return {
		statusCode: 200,
		body: JSON.stringify({
			message: 123
		})
	};
};
