#!/bin/bash
set -euxo pipefail
exec > >(tee /var/log/cobol-mf-bootstrap.log) 2>&1

dnf install -y docker git nginx
systemctl enable --now docker

# docker compose plugin
mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

usermod -aG docker ec2-user

cd /opt
git clone --depth 1 --branch "${GIT_REF}" "${GIT_REPO}" cobol-mf
cd cobol-mf

cat > .env <<EOF
POSTGRES_USER=cobolmf
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=cobolmf
NEXTAUTH_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
BOOTSTRAP_ADMIN_EMAIL=${BOOTSTRAP_EMAIL}
BOOTSTRAP_ADMIN_PASSWORD=${BOOTSTRAP_PASSWORD}
EOF

# Build the cobol runtime image used by the runner.
docker build -t cobol-mf/cobol-runtime:latest -f services/runner/Dockerfile.cobol services/runner

docker compose --profile prod up -d

# nginx reverse proxy on :80 -> :3000
cat > /etc/nginx/conf.d/cobol-mf.conf <<'NGINX'
server {
  listen 80 default_server;
  server_name _;
  client_max_body_size 2m;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
NGINX
rm -f /etc/nginx/conf.d/default.conf
systemctl enable --now nginx
nginx -s reload || true
