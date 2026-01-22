#!/bin/bash
# Script setup ban đầu cho VPS
# Chạy script này trên VPS một lần để cấu hình ban đầu

set -e

echo "🚀 Bắt đầu setup VPS cho Livestream Platform..."

# Tạo thư mục dự án
mkdir -p /var/www/livestream
cd /var/www/livestream

# 1. Tạo file .env (người dùng cần chỉnh sửa)
echo "📝 Tạo file .env..."
cat > .env << 'EOL'
# Database
POSTGRES_DB=livestream_db
POSTGRES_USER=livestream_user
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD

# Backend
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/livestream_db
SPRING_DATASOURCE_USERNAME=livestream_user
SPRING_DATASOURCE_PASSWORD=CHANGE_THIS_PASSWORD
SPRING_REDIS_HOST=redis
SPRING_REDIS_PORT=6379
JWT_SECRET=CHANGE_THIS_JWT_SECRET
CORS_ALLOWED_ORIGINS=https://gachoilongthansoi.com

# Frontend
VITE_API_URL=https://gachoilongthansoi.com/api
VITE_WS_URL=wss://gachoilongthansoi.com/ws/chat
VITE_HLS_BASE_URL=https://gachoilongthansoi.com/live

# Recording
RECORDING_BASE_PATH=/recordings
RECORDING_OUTPUT_PATH=/videos
RECORDING_VIDEO_URL_BASE=https://gachoilongthansoi.com/videos
RECORDING_THUMBNAIL_URL_BASE=https://gachoilongthansoi.com/videos/thumbnails
RECORDING_RETENTION_DAYS=30

# Docker Registry (sẽ được set bởi GitHub Actions)
DOCKER_REGISTRY=ghcr.io/YOUR_USERNAME/YOUR_REPO
TAG=latest
EOL

chmod 600 .env
echo "✅ Đã tạo file .env. Vui lòng chỉnh sửa các giá trị CHANGE_THIS_*"

# 2. Cấu hình Nginx
echo "📝 Cấu hình Nginx..."
cat > /etc/nginx/sites-available/gachoilongthansoi.com << 'EOL'
server {
    listen 80;
    server_name gachoilongthansoi.com www.gachoilongthansoi.com;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8080/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket
    location /ws {
        proxy_pass http://localhost:8080/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
    
    # HLS Live Streaming
    location /live {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        add_header Cache-Control no-cache;
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
        add_header Access-Control-Allow-Headers "*";
    }
    
    # Video recordings
    location /videos {
        proxy_pass http://localhost:8081/videos;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=86400";
        add_header Access-Control-Allow-Origin *;
    }
}
EOL

# Kích hoạt cấu hình
ln -sf /etc/nginx/sites-available/gachoilongthansoi.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test cấu hình nginx
if nginx -t; then
    echo "✅ Cấu hình Nginx hợp lệ"
    systemctl reload nginx
else
    echo "❌ Cấu hình Nginx có lỗi. Vui lòng kiểm tra lại."
    exit 1
fi

# 3. Cấu hình firewall
echo "🔥 Cấu hình firewall..."
ufw allow ssh
ufw allow http
ufw allow https
ufw allow 1935/tcp  # RTMP port
ufw --force enable
echo "✅ Firewall đã được cấu hình"

# 4. Hướng dẫn tiếp theo
echo ""
echo "✅ Setup ban đầu hoàn tất!"
echo ""
echo "📋 Các bước tiếp theo:"
echo "1. Chỉnh sửa file /var/www/livestream/.env và thay thế các giá trị CHANGE_THIS_*"
echo "2. Đảm bảo các file srs.conf, nginx-hls.conf, docker-compose.prod.yml đã có trong /var/www/livestream"
echo "3. Cài đặt SSL: certbot --nginx -d gachoilongthansoi.com -d www.gachoilongthansoi.com"
echo "4. Sau khi GitHub Actions build xong, chạy: cd /var/www/livestream && docker compose -f docker-compose.prod.yml up -d"
echo ""
