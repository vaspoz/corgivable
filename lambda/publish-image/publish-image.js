const aws = require("aws-sdk");
const { IgApiClient } = require("instagram-private-api");
const {
	StickerBuilder
} = require("instagram-private-api/dist/sticker-builder");
const { default: axios } = require("axios");
const pngToJpeg = require("png-to-jpeg");

let dynamodb = new aws.DynamoDB.DocumentClient();
const tableName = "corgi-meta-data";

exports.handler = async () => {
	// 1. Select an item to publish
	let items = await getAllNotPublishedCorgiImages();
	if (!items || items.length <= 0) return;
	const rnd = Math.floor(Math.random() * items.length);
	const publishItem = items[rnd];
	console.log("Publishing the item: " + JSON.stringify(publishItem));
	if (!publishItem) return;

	// 2. Publish it as a post + story
	const tempUrl = getPresignedUrlForRandomImage(publishItem);
	const ig = await igAuthenticate();
	const { jpgFile, postHashes } = await getImageDataForPublishing(tempUrl);
	await publishPhoto(ig, jpgFile, postHashes);

	// 3. Set 'published' to true to exclude from next iteration
	await updateDynamoDBRecordFor(publishItem);

	return {
		statusCode: 200
	};
};

const igAuthenticate = async () => {
	const { igUsername, igPassword } = await getIgCredentials();

	const ig = new IgApiClient();
	ig.state.generateDevice(igUsername);
	await ig.account.login(igUsername, igPassword);
	return ig;
};

const getIgCredentials = async () => {
	const ssm = new aws.SSM();
	var ssmRequestParams = {
		Name: "/production/ig/username",
		WithDecryption: true
	};
	const igUsername = (await ssm.getParameter(ssmRequestParams).promise())
		.Parameter.Value;
	ssmRequestParams.Name = "/production/ig/password";
	const igPassword = (await ssm.getParameter(ssmRequestParams).promise())
		.Parameter.Value;
	return { igUsername, igPassword };
};

const getPresignedUrlForRandomImage = (publishItem) => {
	const s3 = new aws.S3();
	const bucketName = process.env.CORGI_BUCKET_NAME;

	const tempUrl = s3.getSignedUrl("getObject", {
		Bucket: bucketName,
		Key: publishItem.key,
		Expires: 60
	});
	console.log("Presigned URL: ", tempUrl);
	return tempUrl;
};

const updateDynamoDBRecordFor = async (publishItem) => {
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
};

const getAllNotPublishedCorgiImages = async () => {
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
	return items;
};

const publishPhoto = async (ig, jpgFile, postHashes) => {
	await ig.publish.photo({
		file: jpgFile,
		caption: postHashes
	});
};

const getImageDataForPublishing = async (tempUrl) => {
	const postHashes =
		"#corgi #digitalart #doglover #instadog #dogs_of_instagram #corgilover #corgidaily #corgilicious #corgicuteness #corgithings #corgiart #corgidigitalart #digitalcorgiart #corgilove #corgipower #corgisofinstagram #corgisofig #corgicommunity #corgiworld #corgidrawing #corgipainting #corgigram #corgiartwork #corgiartist #corgidoodle #corgipost #corgicute #corgilife #corgiaddict #corgitopia";

	const imageArray = await axios.get(tempUrl, {
		responseType: "arraybuffer"
	});
	const pngFile = Buffer.from(imageArray.data, "utf-8");
	const jpgFile = await pngToJpeg({ quality: 90 })(pngFile);
	return { jpgFile, postHashes };
};
