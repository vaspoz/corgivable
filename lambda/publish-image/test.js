/** Cut & Paste Node.js Code **/
const SocialPost = require("social-post-api"); // Install "npm i social-post-api"

// Live API Key
const social = new SocialPost("SDXNEYX-CG84848-KKGDF4T-0ZS1D3Y");

const post = social
	.post({
		post: "helloooo!",
		platforms: ["instagram"],
		mediaUrls: ["https://img.ayrshare.com/012/gb.jpg"]
	})
	.catch(console.error);
