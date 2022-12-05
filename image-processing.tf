module "s3_corgi_images" {
  source = "terraform-aws-modules/s3-bucket/aws"

  bucket = "corgi-rendered-ready"
  acl    = "private"

}
