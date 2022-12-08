const axios = require("axios");
require("dotenv").config();

let url = `https://discord.com/api/v8/applications/${process.env.APP_ID}/guilds/${process.env.GUILD_ID}/commands`;

const headers = {
	Authorization: `Bot ${process.env.BOT_TOKEN}`,
	"Content-Type": "application/json"
};

let command_data = {
	name: "make",
	options: [
		{
			type: 3,
			name: "draft",
			description: "prompt draft",
			required: true
		}
	],
	description: "make a prompt"
};

// axios
// 	.get(url, { headers })
// 	.then((data) => console.log(data))
// 	.catch((err) => console.log("err", err.message));
axios
	.post(url, JSON.stringify(command_data), {
		headers: headers
	})
	.then((data) => console.log(JSON.stringify(data)))
	.catch((err) => console.log("error", err));
