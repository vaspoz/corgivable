const aws = require("aws-sdk");

exports.handler = async (event) => {
	let dynamodb = new aws.DynamoDB.DocumentClient();
	let params = {
		TableName: "corgi-meta-data",
		FilterExpression: "#posted = :posted_value",
		ExpressionAttributeNames: {
			"#posted": "posted"
		},
		ExpressionAttributeValues: {
			":posted_value": "false"
		}
	};

	await dynamodb
		.scan(putRequest)
		.promise()
		.then((data) => console.log("scan result: ", data))
		.catch((err) =>
			console.log("Error during DynamoDB put operation: ", err)
		);

	return {
		statusCode: 200
	};
};
