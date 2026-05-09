#!/bin/bash
set -e

# One-time setup script for school server
# Run this once on the server before enabling auto-deploy

echo "=== Installing Docker ==="
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
else
  echo "Docker already installed, skipping."
fi

echo "=== Cloning repository ==="
if [ ! -d /opt/llm-stock-trader-trainer ]; then
  git clone https://github.com/fengtsetsai/llm-stock-trader-trainer /opt/llm-stock-trader-trainer
else
  echo "Repository already exists, skipping clone."
fi

echo "=== Creating backend .env ==="
if [ ! -f /opt/llm-stock-trader-trainer/backend/.env ]; then
  cat > /opt/llm-stock-trader-trainer/backend/.env <<EOF
TAVILY_API_KEY=your-tavily-api-key-here
EOF
  echo "Created backend/.env — please edit TAVILY_API_KEY before starting."
else
  echo "backend/.env already exists, skipping."
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "1. Edit /opt/llm-stock-trader-trainer/backend/.env and fill in TAVILY_API_KEY"
echo "2. Add the following GitHub Secrets to your repository:"
echo "   SCHOOL_HOST     = $(hostname -I | awk '{print $1}')"
echo "   SCHOOL_USER     = $(whoami)"
echo "   SCHOOL_SSH_KEY  = (paste your SSH private key)"
echo "   VITE_API_URL    = http://$(hostname -I | awk '{print $1}'):8000"
echo "   CORS_EXTRA_ORIGIN = http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "3. Generate SSH key pair if needed:"
echo "   ssh-keygen -t ed25519 -C 'github-actions-deploy'"
echo "   cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys"
echo "   cat ~/.ssh/id_ed25519  <- paste this as SCHOOL_SSH_KEY secret"
