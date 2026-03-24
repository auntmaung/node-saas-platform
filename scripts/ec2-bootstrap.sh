#!/usr/bin/env bash
# One-time EC2 bootstrap — Amazon Linux 2023
# Usage: bash ec2-bootstrap.sh <git-repo-url>
# Example: bash ec2-bootstrap.sh https://github.com/auntmaung/node-saas-platform.git
set -euo pipefail

REPO_URL="${1:-https://github.com/auntmaung/node-saas-platform.git}"
DEPLOY_DIR="$HOME/saas-platform"

echo "==> [1/5] Installing Docker and Git..."
sudo dnf update -y
sudo dnf install -y docker git

echo "==> [2/5] Starting Docker service..."
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"

echo "==> [3/5] Installing Docker Compose plugin..."
COMPOSE_VERSION=$(curl -fsSL https://api.github.com/repos/docker/compose/releases/latest \
  | grep '"tag_name"' | cut -d'"' -f4)
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -fsSL \
  "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
docker compose version

echo "==> [4/5] Cloning repo to $DEPLOY_DIR..."
git clone "$REPO_URL" "$DEPLOY_DIR"

echo "==> [5/5] Setting up .env..."
cp "$DEPLOY_DIR/.env.example" "$DEPLOY_DIR/.env"

echo ""
echo "============================================================"
echo " Bootstrap complete!"
echo " IMPORTANT: Fill in secrets before starting the stack:"
echo "   nano $DEPLOY_DIR/.env"
echo ""
echo " Then start:"
echo "   newgrp docker"
echo "   cd $DEPLOY_DIR && docker compose up --build -d"
echo "============================================================"
