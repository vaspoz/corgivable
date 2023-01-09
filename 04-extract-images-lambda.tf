resource "aws_lambda_function" "extract_images" {
  filename      = "${path.module}/zip-extract-images.zip"
  function_name = "extract-images"
  role          = aws_iam_role.lambda_role.arn
  handler       = "extract-images.handler"
  runtime       = "nodejs16.x"
  depends_on    = [aws_iam_role_policy_attachment.attach_iam_policy_to_iam_role, data.archive_file.extract_images_zip]

  source_code_hash = data.archive_file.extract_images_zip.output_base64sha256

  timeout = 60

  layers = [aws_lambda_layer_version.node_modules_layer.arn]

  environment {
    variables = {
      CORGI_BUCKET_NAME = module.s3_corgi_images.s3_bucket_id
    }
  }
}

data "archive_file" "extract_images_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/extract-images/extract-images.js"
  output_path = "${path.module}/zip-extract-images.zip"
}

resource "aws_lambda_permission" "api_gateway_invoke_lambda_extract_images" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.extract_images.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.discord_api_gateway.apigatewayv2_api_execution_arn}/*/*"
}
