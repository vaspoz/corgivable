data "archive_file" "lambda_layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-layer"
  output_path = "${path.module}/zip-lambda_layer.zip"
}


resource "aws_lambda_layer_version" "node_modules_layer" {
  filename   = "${path.module}/zip-lambda_layer.zip"
  layer_name = "node_modules"

  compatible_runtimes = ["nodejs16.x"]
  source_code_hash    = data.archive_file.lambda_layer_zip.output_base64sha256
}
