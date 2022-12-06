const axios = require("axios").default;
require("dotenv").config();

let url = `https://discord.com/api/v8/applications/${process.env.APP_ID}/guilds/${process.env.GUILD_ID}/commands`;

const headers = {
	Authorization: `Bot ${process.env.BOT_TOKEN}`,
	"Content-Type": "application/json"
};

let command_data = {
	name: "pull",
	type: 3
	// description: "pull the i"
};

axios.post(url, JSON.stringify(command_data), {
	headers: headers
});
