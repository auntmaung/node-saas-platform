#!/usr/bin/env bash
# One-time EC2 bootstrap — Amazon Linux 2023
# Usage: bash ec2-bootstrap.sh <git-repo-url>
# Example: bash ec2-bootstrap.sh https://github.com/auntmaung/node-saas-platform.git
set -euo pipefail

REPO_URL="${1:-https://github.com/auntmaung/node-saas-platform.git}"
DEPLOY_DIR="$HOME/saas-platform"

echo "==> [1/6] Installing Docker, Buildx and Git..."
sudo dnf update -y
sudo dnf install -y docker docker-buildx-plugin git

echo "==> [2/6] Starting Docker service..."
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"

echo "==> [3/6] Installing Docker Compose plugin (latest)..."
COMPOSE_VERSION=$(curl -fsSL https://api.github.com/repos/docker/compose/releases/latest \
  | grep '"tag_name"' | cut -d'"' -f4)
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -fsSL \
  "https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.linux-amd64" \
  -o /usr/local/lib/docker/cli-plugins/docker-buildx
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx
docker buildx version

echo "==> [4/6] Installing Docker Compose plugin..."
COMPOSE_VERSION=$(curl -fsSL https://api.github.com/repos/docker/compose/releases/latest \
  | grep '"tag_name"' | cut -d'"' -f4)
sudo curl -fsSL \
  "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
docker compose version
docker buildx version

echo "==> [4/6] Cloning repo to $DEPLOY_DIR..."
git clone "$REPO_URL" "$DEPLOY_DIR"

echo "==> [5/6] Setting up .env..."
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
echo ""
echo " If you see 'compose build requires buildx 0.17.0 or later':"
echo "   sudo dnf install -y docker-buildx-plugin"
echo "============================================================"
