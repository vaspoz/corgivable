resource "aws_lambda_function" "publish_image" {
  filename      = "${path.module}/zip-publish-image.zip"
  function_name = "publish-image"
  role          = aws_iam_role.lambda_role.arn
  handler       = "publish-image.handler"
  runtime       = "nodejs16.x"
  depends_on    = [aws_iam_role_policy_attachment.attach_iam_policy_to_iam_role, data.archive_file.publish_image_zip]

  source_code_hash = data.archive_file.publish_image_zip.output_base64sha256

  timeout = 30

  layers = [aws_lambda_layer_version.node_modules_layer.arn]
}

data "archive_file" "publish_image_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/publish-image/publish-image.js"
  output_path = "${path.module}/zip-publish-image.zip"
}

# resource "aws_lambda_permission" "cloud_watch_invoke_lambda" {
#   statement_id  = "AllowExecutionFromCloudWatch"
#   action        = "lambda:InvokeFunction"
#   function_name = aws_lambda_function.publish_image.function_name
#   principal     = "events.amazonaws.com"
#   source_arn    = "${module.discord_api_gateway.apigatewayv2_api_execution_arn}/*/*"
# }



# ***********************************
#    Event rule to trigger lambda
# ***********************************
