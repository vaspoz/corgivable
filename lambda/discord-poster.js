const { Client, Events, GatewayIntentBits } = require("discord.js");

exports.handler = async (event) => {
	const prompt_message = event.Records[0].Sns.Message;

	if (!prompt_message) return;
	console.log("Received message: " + prompt_message);

	const client = new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.MessageContent
		]
	});

	await client.once(Events.ClientReady, async (c) => {
		console.log(`Ready! Logged in as ${c.user.tag}`);

		await c.channels.cache.get("1046390849765912692").send(prompt_message);

		c.destroy();
	});

	await client.login(process.env.TOKEN);
};
