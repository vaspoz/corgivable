const aws = require("aws-sdk");
const tableName = "corgi-meta-data";

exports.handler = async (event, context) => {
	const number = event.pathParameters.number;
	if (!number) return;

	console.log("Images: " + number);
	let items = await getPublishedImages(number);
	if (!items || items.length <= 0) return;

	const imageUrls = items.map((imageKey) => {
		return getPresignedUrlForImage(imageKey);
	});

	console.log("items: " + JSON.stringify(imageUrls));
	return {
		statusCode: 200,
		body: JSON.stringify(imageUrls)
	};
};

const getPresignedUrlForImage = (imageKey) => {
	const s3 = new aws.S3();
	const bucketName = process.env.CORGI_BUCKET_NAME;

	const tempUrl = s3.getSignedUrl("getObject", {
		Bucket: bucketName,
		Key: imageKey,
		Expires: 300
	});
	return tempUrl;
};

const getPublishedImages = async (number) => {
	let dynamodb = new aws.DynamoDB.DocumentClient();

	let params = {
		TableName: tableName,
		FilterExpression: "#posted = :posted_value",
		ExpressionAttributeNames: {
			"#posted": "posted"
		},
		ExpressionAttributeValues: {
			":posted_value": "true"
		}
	};

	let items = [];
	await dynamodb
		.scan(params)
		.promise()
		.then((data) => {
			console.log("Posted images size: ", data.Items.length);
			items = data.Items;
			items.sort((first, second) => {
				let firstDate = new Date(first["posted_time_stamp"]);
				let secondDate = new Date(second["posted_time_stamp"]);
				return secondDate - firstDate; // from newest to oldest
			});
			items = items.slice(0, number);
			items = items.map((elt) => {
				return elt.key;
			});
		})
		.catch((err) =>
			console.log("Error during DynamoDB put operation: ", err)
		);
	return items;
};
