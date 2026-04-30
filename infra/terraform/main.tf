terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    http = {
      source  = "hashicorp/http"
      version = "~> 3.4"
    }
  }
}

provider "aws" {
  region = var.region
}

data "http" "myip" {
  url = "https://checkip.amazonaws.com"
}

locals {
  caller_ip   = chomp(data.http.myip.response_body)
  ssh_cidr    = var.admin_ip != "" ? "${var.admin_ip}/32" : "${local.caller_ip}/32"
  bootstrap_email    = var.admin_email
  bootstrap_password = var.admin_password
  postgres_password  = var.postgres_password
  nextauth_secret    = var.nextauth_secret
}

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["137112412989"] # Amazon
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "tls_private_key" "deploy" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "deploy" {
  key_name   = "cobol-mf-${random_id.suffix.hex}"
  public_key = tls_private_key.deploy.public_key_openssh
}

resource "random_id" "suffix" {
  byte_length = 4
}

resource "local_file" "private_key" {
  filename        = "${path.module}/keys/cobol-mf-${random_id.suffix.hex}.pem"
  content         = tls_private_key.deploy.private_key_pem
  file_permission = "0600"
}

resource "aws_security_group" "app" {
  name        = "cobol-mf-${random_id.suffix.hex}"
  description = "cobol-mf app + ssh"

  ingress {
    description = "ssh from admin"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [local.ssh_cidr]
  }
  ingress {
    description = "http"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "https"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "app" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = var.instance_type
  key_name                    = aws_key_pair.deploy.key_name
  vpc_security_group_ids      = [aws_security_group.app.id]
  associate_public_ip_address = true
  user_data = templatefile("${path.module}/user-data.sh", {
    GIT_REPO            = var.git_repo
    GIT_REF             = var.git_ref
    POSTGRES_PASSWORD   = local.postgres_password
    NEXTAUTH_SECRET     = local.nextauth_secret
    BOOTSTRAP_EMAIL     = local.bootstrap_email
    BOOTSTRAP_PASSWORD  = local.bootstrap_password
  })

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name = "cobol-mf-${random_id.suffix.hex}"
  }
}

resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"
}
