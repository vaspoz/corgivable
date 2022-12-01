const aws = require("aws-sdk");

exports.handler = async (event) => {
	console.log("let's begin");
	console.log(event.Records[0].Sns.Message);
};
