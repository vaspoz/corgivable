module "main_vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "vpc-main"
  cidr = "10.0.0.0/16"

  azs = ["eu-central-1a", "eu-central-1b"]

  public_subnets      = ["10.0.1.0/24"]
  public_subnet_names = ["subnet-main-public-01"]

}

# Lambda resources
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
   }
 ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "attach_iam_policy_to_iam_role" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

data "archive_file" "discord_prompt_poster_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/discord-poster.js"
  output_path = "${path.module}/discord-poster-lambda.zip"
}

resource "aws_lambda_function" "discord_prompt_poster" {
  filename      = "${path.module}/discord-poster-lambda.zip"
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

data "archive_file" "lambda_layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-layer"
  output_path = "${path.module}/lambda_layer.zip"
}

resource "aws_lambda_layer_version" "node_modules_layer" {
  filename   = "${path.module}/lambda_layer.zip"
  layer_name = "node_modules"

  compatible_runtimes = ["nodejs16.x"]
  source_code_hash    = data.archive_file.lambda_layer_zip.output_base64sha256
}
