console.log("Loading function");

const aws = require("aws-sdk");

const s3 = new aws.S3({ apiVersion: "2006-03-01" });

exports.handler = async (event) => {
	const response = {
		statusCode: 200,
		headers: {
			"Content-Type": "text/html"
		},
		body: "Hello world"
	};
	return response;
};
