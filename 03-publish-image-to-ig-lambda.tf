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

  environment {
    variables = {
      CORGI_BUCKET_NAME       = module.s3_corgi_images.s3_bucket_id
      SOCIAL_PLATFORM_API_KEY = var.social_platform_key
    }
  }
}

data "archive_file" "publish_image_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/publish-image/publish-image.js"
  output_path = "${path.module}/zip-publish-image.zip"
}

# ***********************************
#    Event rule to trigger lambda
# ***********************************

resource "aws_cloudwatch_event_rule" "publish_image_event_rule" {
  name                = "publish-image-trigger"
  description         = "trigger at 7 and 18"
  schedule_expression = "cron(0 6,17 * * ? *)"
}

resource "aws_cloudwatch_event_target" "publish_image_lambda_target" {
  arn  = aws_lambda_function.publish_image.arn
  rule = aws_cloudwatch_event_rule.publish_image_event_rule.name
}

resource "aws_lambda_permission" "cloud_watch_invoke_lambda" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.publish_image.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.publish_image_event_rule.arn
}
