const { Client, Events, GatewayIntentBits } = require("discord.js");
const nacl = require("tweetnacl");
const aws = require("aws-sdk");
const axios = require("axios");

exports.handler = async (event) => {
	// Checking signature (requirement 1.)
	// Your public key can be found on your application in the Developer Portal
	const PUBLIC_KEY = process.env.PUBLIC_KEY;
	const signature = event.headers["x-signature-ed25519"];
	const timestamp = event.headers["x-signature-timestamp"];
	const strBody = event.body; // should be string, for successful sign

	const isVerified = nacl.sign.detached.verify(
		Buffer.from(timestamp + strBody),
		Buffer.from(signature, "hex"),
		Buffer.from(PUBLIC_KEY, "hex")
	);

	if (!isVerified) {
		return {
			statusCode: 401,
			body: JSON.stringify("invalid request signature")
		};
	}

	// Replying to ping (requirement 2.)
	const body = JSON.parse(strBody);
	if (body.type == 1) {
		return {
			statusCode: 200,
			body: JSON.stringify({ type: 1 })
		};
	}

	// Handle a command
	if (body.data.name == "pull") {
		let messageObject = Object.values(body.data.resolved.messages)[0];
		let imageUrl = messageObject.attachments[0].url;
		let imageName = messageObject.attachments[0].filename;
		let imagePrompt = messageObject.content;

		console.log("URL: " + imageUrl);
		console.log("Name: " + imageName);
		console.log("Prompt: " + imagePrompt);

		let imageData = "";
		await axios({
			url: imageUrl,
			method: "GET",
			responseType: "arraybuffer" // important
		}).then((response) => {
			imageData = response.data;
		});

		if (!imageData) {
			return JSON.stringify({
				type: 4,
				data: {
					content: "Error during image processing"
				}
			});
		}

		let s3 = new aws.S3();
		let uploadParams = {
			Bucket: "corgi-rendered-images-ready",
			Key: imageName,
			Body: imageData
		};

		await s3
			.upload(uploadParams, (err, data) => {
				if (err) {
					console.log(err);
					return JSON.stringify({
						type: 4,
						data: {
							content: "Error during image processing"
						}
					});
				}
				if (data) {
					console.log("Upload Success", data.Location);
				}
			})
			.promise();

		return JSON.stringify({
			type: 4,
			data: {
				content: "Pulled"
			}
		});
	}

	if (body.data.name == "foo") {
		return JSON.stringify({
			type: 4,
			data: {
				content: "here's the reply"
			}
		});
	}

	return {
		statusCode: 404
	};
};
