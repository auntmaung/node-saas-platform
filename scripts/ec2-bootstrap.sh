#!/usr/bin/env bash
# One-time EC2 bootstrap script.
# Tested on Ubuntu 22.04 / 24.04 (Amazon Linux 2023: replace apt-get with dnf).
# Run as a non-root user with sudo access.
set -euo pipefail

REPO_URL="${1:-}"        # e.g. git@github.com:yourorg/saas-platform.git
DEPLOY_DIR="$HOME/saas-platform"

# ── 1. Docker Engine ─────────────────────────────────────────────────────────
echo "==> Installing Docker..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# ── 2. Add user to docker group (re-login required for it to take effect) ────
sudo usermod -aG docker "$USER"
echo "NOTE: Log out and back in (or run 'newgrp docker') for docker group to take effect."

# ── 3. Clone repo ─────────────────────────────────────────────────────────────
if [ -z "$REPO_URL" ]; then
  echo "Usage: $0 <git-repo-url>"
  echo "Skipping git clone — set up the repo manually at $DEPLOY_DIR"
else
  echo "==> Cloning repo..."
  git clone "$REPO_URL" "$DEPLOY_DIR"
fi

# ── 4. Create .env from example ───────────────────────────────────────────────
if [ -d "$DEPLOY_DIR" ]; then
  cp "$DEPLOY_DIR/.env.example" "$DEPLOY_DIR/.env"
  echo ""
  echo "==> IMPORTANT: Edit $DEPLOY_DIR/.env and fill in all secrets before starting."
  echo "    Use: nano $DEPLOY_DIR/.env"
  echo ""
fi

echo "==> Bootstrap complete."
echo "    After editing .env, start the stack with:"
echo "    cd $DEPLOY_DIR && docker compose up --build -d"
