module "sns_topic_ready_prompt" {
  source  = "terraform-aws-modules/sns/aws"
  version = "4.0.0"

  name = "ready-prompt"
}

resource "aws_sns_topic_subscription" "ready_prompt_lambda_target" {
  topic_arn = module.sns_topic_ready_prompt.sns_topic_arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.discord_prompt_poster.arn
}
