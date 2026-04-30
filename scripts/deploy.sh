#!/usr/bin/env bash
set -euo pipefail

# scripts/deploy.sh — one-shot AWS deploy.
#
# Usage:
#   AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... \
#     ./scripts/deploy.sh [--region us-east-1] [--git-ref main] \
#                         [--git-repo https://...] \
#                         [--admin-email admin@example.com] \
#                         [--admin-password ...]

REGION=us-east-1
GIT_REF=main
GIT_REPO="${GIT_REPO:-https://github.com/your-org/cobol-mf.git}"
ADMIN_EMAIL=""
ADMIN_PASSWORD=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)         REGION="$2"; shift 2 ;;
    --git-ref)        GIT_REF="$2"; shift 2 ;;
    --git-repo)       GIT_REPO="$2"; shift 2 ;;
    --admin-email)    ADMIN_EMAIL="$2"; shift 2 ;;
    --admin-password) ADMIN_PASSWORD="$2"; shift 2 ;;
    -h|--help)
      sed -n '3,12p' "$0"; exit 0 ;;
    *) echo "unknown arg: $1"; exit 1 ;;
  esac
done

command -v terraform >/dev/null || {
  echo "terraform not found. install: https://developer.hashicorp.com/terraform/downloads" >&2
  exit 1
}
command -v aws >/dev/null || {
  echo "aws cli not found. install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html" >&2
  exit 1
}

if [[ -z "${AWS_ACCESS_KEY_ID:-}" || -z "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
  echo "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set" >&2
  exit 1
}

# Generate secrets if not supplied.
rand24() { LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 24; }
ADMIN_PASSWORD="${ADMIN_PASSWORD:-$(rand24)}"
POSTGRES_PASSWORD="$(rand24)"
NEXTAUTH_SECRET="$(rand24)$(rand24)"

cd "$(dirname "$0")/../infra/terraform"
mkdir -p keys

terraform init -upgrade
terraform apply -auto-approve \
  -var "region=${REGION}" \
  -var "git_repo=${GIT_REPO}" \
  -var "git_ref=${GIT_REF}" \
  -var "admin_email=${ADMIN_EMAIL:-admin@cobol-mf.local}" \
  -var "admin_password=${ADMIN_PASSWORD}" \
  -var "postgres_password=${POSTGRES_PASSWORD}" \
  -var "nextauth_secret=${NEXTAUTH_SECRET}"

PUBLIC_IP=$(terraform output -raw public_ip)
PUBLIC_URL=$(terraform output -raw public_url)
SSH_CMD=$(terraform output -raw ssh_command)
EMAIL_OUT=$(terraform output -raw admin_email)

# If no admin email was supplied, derive a default from the IP.
if [[ -z "$ADMIN_EMAIL" ]]; then
  ADMIN_EMAIL="admin@${PUBLIC_IP}.nip.io"
  # Re-run with the derived email so seed picks it up.
  terraform apply -auto-approve \
    -var "region=${REGION}" \
    -var "git_repo=${GIT_REPO}" \
    -var "git_ref=${GIT_REF}" \
    -var "admin_email=${ADMIN_EMAIL}" \
    -var "admin_password=${ADMIN_PASSWORD}" \
    -var "postgres_password=${POSTGRES_PASSWORD}" \
    -var "nextauth_secret=${NEXTAUTH_SECRET}"
  EMAIL_OUT="$ADMIN_EMAIL"
fi

echo
echo "Waiting for the app to come up at ${PUBLIC_URL}…"
DEADLINE=$(( $(date +%s) + 600 ))
while true; do
  if curl -fsS "http://${PUBLIC_IP}/api/health" >/dev/null 2>&1; then
    break
  fi
  if [[ $(date +%s) -gt $DEADLINE ]]; then
    echo "timed out waiting for /api/health" >&2
    exit 2
  fi
  sleep 10
done

cat <<EOF

✓ Deployment complete

URL:            ${PUBLIC_URL}
Admin email:    ${EMAIL_OUT}
Admin password: ${ADMIN_PASSWORD}
SSH:            ${SSH_CMD}
Region:         ${REGION}
Tear down:      terraform -chdir=infra/terraform destroy

EOF
