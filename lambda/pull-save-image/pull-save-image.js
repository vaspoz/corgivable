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
		// ***************
		// Get image data
		// ***************
		let messageObject = Object.values(body.data.resolved.messages)[0];
		let imageUrl = messageObject.attachments[0].url;
		let imageName = messageObject.attachments[0].filename;
		// from: **corgi Jedi baby in the forest --v 4 --q 2** - Upscaled by <@818596818983583831> (fast)
		// to: corgi Jedi baby in the forest --v 4 --q 2
		let imagePrompt = messageObject.content;
		imagePrompt = imagePrompt.match(/\*\*.*\*\*/)[0].slice(2, -2);

		console.log("URL: " + imageUrl);
		console.log("Name: " + imageName);
		console.log("Prompt: " + imagePrompt);

		// ******************
		// Save it to S3
		// ******************
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

		// *******************************
		// Save metadata to DynamoDB
		// *******************************
		let dynamodb = new aws.DynamoDB.DocumentClient();
		let putRequest = {
			TableName: "corgi-meta-data",
			Item: {
				key: imageName,
				posted: "false",
				prompt: imagePrompt
			}
		};

		await dynamodb.put(putRequest).promise();

		return JSON.stringify({
			type: 4,
			data: {
				content: "Pulled"
			}
		});
	}

	if (body.data.name == "make") {
		let sqs = new aws.SQS();
		if (!body.data.options) return errorResponse;

		let message = body.data.options[0].value;
		console.log("Received draft: " + message);
		let sqsParams = {
			MessageBody: message,
			QueueUrl: process.env.QUEUE_URL
		};
		await sqs.sendMessage(sqsParams).promise();
		return makeSuccess;
	}

	return {
		statusCode: 404
	};
};

const errorResponse = JSON.stringify({
	type: 4,
	data: {
		content: "Error during request processing"
	}
});

const makeSuccess = JSON.stringify({
	type: 4,
	data: {
		content: "Queued"
	}
});
