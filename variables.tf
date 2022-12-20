variable "discord_token" {
  type        = string
  description = "A token"
  sensitive   = true
}

variable "discord_public_key" {
  type        = string
  description = "A public key"
  sensitive   = true
}

variable "ig_username" {
  type        = string
  description = "Username"
  sensitive   = true
}

variable "ig_password" {
  type        = string
  description = "Password"
  sensitive   = true
}
