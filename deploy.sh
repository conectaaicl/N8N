#!/bin/bash
# =============================================================
# OmniFlow — Production Deploy Script
# Run on VPS: bash deploy.sh
# =============================================================
set -e

REPO_URL="https://github.com/conectaaicl/N8N.git"
APP_DIR="/var/www/omniflow"
NGINX_SITE="osw.conectaai.cl"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  OmniFlow — Deploy to Production"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Clone or pull repo
if [ -d "$APP_DIR/.git" ]; then
  echo "▶ Pulling latest from GitHub..."
  cd "$APP_DIR"
  git pull origin main
else
  echo "▶ Cloning repository..."
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# 2. Check .env exists
if [ ! -f "$APP_DIR/.env" ]; then
  echo ""
  echo "⚠  .env file not found! Creating from template..."
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo ""
  echo "🔑  IMPORTANT: Edit .env before continuing:"
  echo "    nano $APP_DIR/.env"
  echo ""
  echo "    Set at minimum:"
  echo "    - POSTGRES_PASSWORD"
  echo "    - SECRET_KEY  (run: python3 -c \"import secrets; print(secrets.token_hex(32))\")"
  echo "    - WHATSAPP_VERIFY_TOKEN"
  echo ""
  read -p "Press ENTER after editing .env to continue..."
fi

# 3. Deploy nginx config
echo "▶ Configuring nginx..."
cp "$APP_DIR/nginx/$NGINX_SITE" "/etc/nginx/sites-available/$NGINX_SITE"
ln -sf "/etc/nginx/sites-available/$NGINX_SITE" "/etc/nginx/sites-enabled/$NGINX_SITE"
nginx -t && systemctl reload nginx
echo "   ✓ nginx configured"

# 4. Build and start containers
echo "▶ Building Docker images..."
cd "$APP_DIR"
docker compose pull n8n
docker compose build --no-cache backend frontend

echo "▶ Starting services..."
docker compose up -d

# 5. Wait for backend health
echo "▶ Waiting for backend to be healthy..."
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:8002/ > /dev/null 2>&1; then
    echo "   ✓ Backend is up!"
    break
  fi
  echo "   ... waiting ($i/30)"
  sleep 3
done

# 6. Status check
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Container Status:"
docker compose ps
echo ""
echo "  URLs:"
echo "    Frontend:  https://osw.conectaai.cl"
echo "    API:       https://osw.conectaai.cl/api/v1"
echo "    n8n:       https://osw.conectaai.cl/n8n"
echo "    API Docs:  https://osw.conectaai.cl/api/v1/openapi.json"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Deploy complete!"
