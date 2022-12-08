const aws = require("aws-sdk");
const SocialPost = require("social-post-api"); // Install "npm i social-post-api"

exports.handler = async (event) => {
	const tableName = "corgi-meta-data";

	let dynamodb = new aws.DynamoDB.DocumentClient();
	let params = {
		TableName: tableName,
		FilterExpression: "#posted = :posted_value",
		ExpressionAttributeNames: {
			"#posted": "posted"
		},
		ExpressionAttributeValues: {
			":posted_value": "false"
		}
	};

	let items = [];
	await dynamodb
		.scan(params)
		.promise()
		.then((data) => {
			console.log("scan result size: ", data.Items.length);
			items = data.Items;
		})
		.catch((err) =>
			console.log("Error during DynamoDB put operation: ", err)
		);

	if (items && items.length > 0) {
		const rnd = Math.floor(Math.random() * items.length);

		const publishItem = items[rnd];
		console.log("Publishing the item: " + JSON.stringify(publishItem));
		if (!publishItem) return;

		const s3 = new aws.S3();
		const bucketName = process.env.CORGI_BUCKET_NAME;
		const postHashes =
			"#corgi #funnypictures #doglover #instadog #dogs_of_instagram #happydog #corgilover #corgidaily #corgilicious #digitalart #corgicuteness #corgithings";

		const tempUrl = s3.getSignedUrl("getObject", {
			Bucket: bucketName,
			Key: publishItem.key,
			Expires: 60
		});
		console.log("Presigned URL: ", tempUrl);

		const social = new SocialPost(process.env.SOCIAL_PLATFORM_API_KEY);
		await social
			.post({
				post: postHashes,
				platforms: ["instagram"],
				mediaUrls: [tempUrl]
			})
			.catch(console.error);

		await dynamodb
			.delete({
				TableName: tableName,
				Key: { key: publishItem.key, posted: publishItem.posted }
			})
			.promise();

		publishItem.posted = "true";
		publishItem["posted_time_stamp"] = new Date().toISOString();
		let updateRequest = {
			TableName: tableName,
			Item: publishItem
		};

		await dynamodb
			.put(updateRequest)
			.promise()
			.then((data) => console.log("Successfully saved the image"))
			.catch((err) =>
				console.log("Error during DynamoDB put operation: " + err)
			);
	}

	return {
		statusCode: 200
	};
};
