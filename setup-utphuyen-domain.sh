#!/bin/bash

# Script để cấu hình domain utphuyen.com vào server
# Chạy script này trên VPS sau khi đã trỏ DNS

set -e

echo "🚀 Bắt đầu cấu hình domain utphuyen.com..."

# 1. Tạo cấu hình Nginx cho utphuyen.com
echo "📝 Tạo cấu hình Nginx cho utphuyen.com..."
cat > /etc/nginx/sites-available/utphuyen.com << 'EOF'
server {
    listen 80;
    server_name utphuyen.com www.utphuyen.com;
    
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
    
    location /ws {
        proxy_pass http://localhost:8080/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    location /live {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control no-cache;
        
    }
    
    location /videos {
        proxy_pass http://localhost:8081/videos;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=3600";
        add_header Access-Control-Allow-Origin *;
    }
}
EOF

# 2. Kích hoạt cấu hình
echo "🔗 Kích hoạt cấu hình Nginx..."
ln -sf /etc/nginx/sites-available/utphuyen.com /etc/nginx/sites-enabled/

# 3. Kiểm tra cấu hình Nginx
echo "✅ Kiểm tra cấu hình Nginx..."
nginx -t

# 4. Khởi động lại Nginx
echo "🔄 Khởi động lại Nginx..."
systemctl restart nginx

# 5. Cài đặt SSL với Let's Encrypt
echo "🔒 Cài đặt SSL cho utphuyen.com..."
certbot --nginx -d utphuyen.com -d www.utphuyen.com --non-interactive --agree-tos --email caoleanhcuong78@gmail.com

echo "✅ Hoàn thành! Domain utphuyen.com đã được cấu hình."
echo "📋 Lưu ý: Bạn cần cập nhật CORS_ALLOWED_ORIGINS trong file .env để bao gồm cả 2 domain"
echo "   Ví dụ: CORS_ALLOWED_ORIGINS=https://utgachoi.com,https://utphuyen.com"
