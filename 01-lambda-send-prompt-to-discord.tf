resource "aws_lambda_function" "discord_prompt_poster" {
  filename      = "${path.module}/zip-discord-poster-lambda.zip"
  function_name = "discord-prompt-poster"
  role          = aws_iam_role.lambda_role.arn
  handler       = "discord-poster.handler"
  runtime       = "nodejs16.x"
  depends_on    = [aws_iam_role_policy_attachment.attach_iam_policy_to_iam_role, data.archive_file.discord_prompt_poster_zip]

  source_code_hash = data.archive_file.discord_prompt_poster_zip.output_base64sha256

  timeout = 30

  layers = [aws_lambda_layer_version.node_modules_layer.arn]
  environment {
    variables = {
      TOKEN = var.discord_token
    }

  }
}

data "archive_file" "discord_prompt_poster_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/discord-poster/discord-poster.js"
  output_path = "${path.module}/zip-discord-poster-lambda.zip"
}

resource "aws_iam_role" "lambda_role" {
  name               = "discord-client-lambda-role"
  assume_role_policy = <<EOF
{
 "Version": "2012-10-17",
 "Statement": [
   {
     "Action": "sts:AssumeRole",
     "Principal": {
       "Service": "lambda.amazonaws.com"
     },
     "Effect": "Allow",
     "Sid": ""
   }
 ]
}
EOF
}

resource "aws_iam_policy" "lambda_policy" {
  name        = "lambda_role_policy"
  path        = "/"
  description = "AWS IAM Policy for managing aws lambda role"
  policy      = <<EOF
{
 "Version": "2012-10-17",
 "Statement": [
   {
     "Action": [
       "logs:CreateLogGroup",
       "logs:CreateLogStream",
       "logs:PutLogEvents"
     ],
     "Resource": "arn:aws:logs:*:*:*",
     "Effect": "Allow"
   },
   {
     "Action": [
       "s3:*"
     ],
     "Resource": [
        "${module.s3_corgi_images.s3_bucket_arn}",
        "${module.s3_corgi_images.s3_bucket_arn}/*"
     ],
     "Effect": "Allow"
   },
   {
      "Action": [
        "dynamodb:Scan",
        "dynamodb:Query",
        "dynamodb:GetRecords",
        "dynamodb:BatchGetItem",
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Scan",
        "dynamodb:UpdateItem"
      ],
      "Resource": [
        "${module.dynamodb_table.dynamodb_table_arn}"
      ],
      "Effect": "Allow"
   }
 ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "attach_iam_policy_to_iam_role" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

resource "aws_lambda_permission" "with_sns" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.discord_prompt_poster.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = module.sns_topic_ready_prompt.sns_topic_arn
}
