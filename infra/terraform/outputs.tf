output "public_ip" {
  value = aws_eip.app.public_ip
}

output "public_url" {
  value = "http://${aws_eip.app.public_ip}/"
}

output "admin_email" {
  value     = var.admin_email
  sensitive = false
}

output "admin_password" {
  value     = var.admin_password
  sensitive = true
}

output "ssh_command" {
  value = "ssh -i ${local_file.private_key.filename} ec2-user@${aws_eip.app.public_ip}"
}
