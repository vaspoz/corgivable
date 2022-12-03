module "ec2_mdjr_prompt_server_sg" {
  source = "terraform-aws-modules/security-group/aws"

  name        = "midj-prompt-server"
  description = "Security group for the server"
  vpc_id      = module.main_vpc.vpc_id

  ingress_cidr_blocks = ["94.208.131.135/32"]
  ingress_rules       = ["all-all"]

  egress_cidr_blocks = ["0.0.0.0/0"]
  egress_rules       = ["all-all"]
}

module "ec2_mdjr_prompt_server" {
  source  = "terraform-aws-modules/ec2-instance/aws"
  version = "~> 3.0"

  name = "midj-prompt-server"

  ami           = "ami-0b8411dcc14f846fd"
  instance_type = "t2.micro"
  root_block_device = [{
    volume_size = 16
  }]
  key_name               = "test-delete-me"
  monitoring             = true
  vpc_security_group_ids = [module.ec2_mdjr_prompt_server_sg.security_group_id]
  subnet_id              = module.main_vpc.public_subnets[0]
}
