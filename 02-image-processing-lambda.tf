resource "aws_lambda_function" "discord_pull_image" {
  filename      = "${path.module}/zip-pull-save-image.zip"
  function_name = "discord-pull-save-image"
  role          = aws_iam_role.lambda_role.arn
  handler       = "pull-save-image.handler"
  runtime       = "nodejs16.x"
  depends_on    = [aws_iam_role_policy_attachment.attach_iam_policy_to_iam_role, data.archive_file.discord_prompt_poster_zip]

  source_code_hash = data.archive_file.discord_pull_image_zip.output_base64sha256

  timeout = 30

  layers = [aws_lambda_layer_version.node_modules_layer.arn]
  environment {
    variables = {
      TOKEN      = var.discord_token
      PUBLIC_KEY = var.discord_public_key
    }

  }
}

data "archive_file" "discord_pull_image_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/pull-save-image/pull-save-image.js"
  output_path = "${path.module}/zip-pull-save-image.zip"
}

resource "aws_lambda_permission" "api_gateway_invoke_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.discord_pull_image.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.discord_api_gateway.apigatewayv2_api_execution_arn}/*/*"
}
