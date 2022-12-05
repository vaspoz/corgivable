const { Client, Events, GatewayIntentBits } = require("discord.js");

exports.handler = async (event) => {
	return {
		statusCode: 200,
		body: JSON.stringify({
			message: 123
		})
	};
};
