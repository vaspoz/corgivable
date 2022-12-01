module "main_vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "vpc-main"
  cidr = "10.0.0.0/16"

  azs                 = ["eu-central-1a"]
  public_subnets      = ["10.0.1.0/24"]
  public_subnet_names = ["subnet-main-private"]

}
