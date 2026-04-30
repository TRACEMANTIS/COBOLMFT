variable "region" {
  type    = string
  default = "us-east-1"
}

variable "instance_type" {
  type    = string
  default = "t3.small"
}

variable "git_repo" {
  type        = string
  description = "Repo to clone on the host."
  default     = "https://github.com/your-org/cobol-mf.git"
}

variable "git_ref" {
  type    = string
  default = "main"
}

variable "admin_ip" {
  type        = string
  description = "Restrict SSH to this IP (no /32). Leave blank to use the deployer's current public IP."
  default     = ""
}

variable "admin_email" {
  type    = string
}

variable "admin_password" {
  type      = string
  sensitive = true
}

variable "postgres_password" {
  type      = string
  sensitive = true
}

variable "nextauth_secret" {
  type      = string
  sensitive = true
}
