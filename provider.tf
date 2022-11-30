terraform {
  backend "remote" {
    # The name of your Terraform Cloud organization.
    organization = "basil-home"

    # The name of the Terraform Cloud workspace to store Terraform state files in.
    workspaces {
      name = "corgivable"
    }
  }
}

provider "aws" {
  region     = "eu-central-1"
  access_key = var.access_key
  secret_key = var.secret_key
}
