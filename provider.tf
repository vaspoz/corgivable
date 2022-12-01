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
}
