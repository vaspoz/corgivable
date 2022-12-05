terraform {
  cloud {
    organization = "basil-home"

    workspaces {
      name = "corgifun"
    }
  }

}

provider "aws" {
  region = "eu-central-1"

  # skip_requesting_account_id should be disabled to generate valid ARN in apigatewayv2_api_execution_arn in API Gateway module
  skip_requesting_account_id = false
}
