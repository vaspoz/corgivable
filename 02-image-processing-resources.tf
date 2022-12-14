module "s3_corgi_images" {
  source = "terraform-aws-modules/s3-bucket/aws"

  bucket = "corgi-rendered-images-ready"
  # acl    = "private"

  block_public_acls       = true
  block_public_policy     = true
  restrict_public_buckets = true

  force_destroy = false
}

# API Gateway
resource "aws_cloudwatch_log_group" "log_group_api_gateway" {
  name = "discord-api-gateway"
}

module "discord_api_gateway" {
  source = "terraform-aws-modules/apigateway-v2/aws"

  name          = "discord-api-gateway"
  protocol_type = "HTTP"

  cors_configuration = {
    allow_headers = ["content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token", "x-amz-user-agent"]
    allow_methods = ["POST", "GET"]
    allow_origins = ["*"]
  }

  create_api_domain_name = false
  create_vpc_link        = false

  default_stage_access_log_destination_arn = aws_cloudwatch_log_group.log_group_api_gateway.arn
  default_stage_access_log_format          = "$context.identity.sourceIp - - [$context.requestTime] \"$context.httpMethod $context.routeKey $context.protocol\" $context.status $context.responseLength $context.requestId $context.integrationErrorMessage"

  integrations = {

    # === Turn this on if you need images ===
    # "GET /images/{number}" = {
    #   lambda_arn             = aws_lambda_function.extract_images.arn
    #   integration_type       = "AWS_PROXY"
    #   payload_format_version = "2.0"
    # }

    "POST /" = {
      integration_type       = "AWS_PROXY"
      lambda_arn             = aws_lambda_function.discord_pull_image.arn
      payload_format_version = "2.0"
    }



    # "$default" = {
    #   lambda_arn = aws_lambda_function.discord_pull_image.arn

    #   response_parameters = jsonencode([
    #     {
    #       status_code = 500
    #       mappings = {
    #         "append:header.header1" = "$context.requestId"
    #         "overwrite:statuscode"  = "403"
    #       }
    #     },
    #     {
    #       status_code = 404
    #       mappings = {
    #         "append:header.error" = "$stageVariables.environmentId"
    #       }
    #     }
    #   ])
    # }

  }
}



# ************************
#     DynamoDB
# ************************
module "dynamodb_table" {
  source = "terraform-aws-modules/dynamodb-table/aws"

  name      = "corgi-meta-data"
  hash_key  = "key"
  range_key = "posted"

  attributes = [
    {
      name = "key"
      type = "S"
    },
    {
      name = "posted"
      type = "S"
    }
  ]
}
