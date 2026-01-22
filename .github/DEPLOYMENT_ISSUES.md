# Các vấn đề trong kế hoạch triển khai và cách khắc phục

## ❌ Vấn đề 1: Website hiển thị trang nginx mặc định

**Nguyên nhân:** Nginx trên VPS chưa được cấu hình để reverse proxy đến frontend container.

**Giải pháp:** Cần cấu hình nginx trên VPS để proxy đến các container.

## ❌ Vấn đề 2: Workflow không copy file cấu hình lên server

**Nguyên nhân:** Workflow hiện tại không copy các file `srs.conf`, `nginx-hls.conf` lên VPS.

**Giải pháp:** Thêm bước copy file trong workflow hoặc đảm bảo các file này đã có trên server.

## ❌ Vấn đề 3: Workflow không tạo file .env trên server

**Nguyên nhân:** Workflow không tạo file `.env` với các biến môi trường cần thiết.

**Giải pháp:** Thêm bước tạo file `.env` trong workflow hoặc tạo thủ công trên server.

## ❌ Vấn đề 4: VITE_HLS_BASE_URL không khớp

**Nguyên nhân:** 
- Trong workflow: `VITE_HLS_BASE_URL=https://gachoilongthansoi.com`
- Trong kế hoạch: `VITE_HLS_BASE_URL=https://gachoilongthansoi.com/live`

**Giải pháp:** Cần thống nhất URL này.

## ❌ Vấn đề 5: Thiếu cấu hình nginx trên VPS

**Nguyên nhân:** Nginx trên VPS cần được cấu hình để:
- Proxy `/` → frontend container (port 3000)
- Proxy `/api` → backend container (port 8080)
- Proxy `/ws` → backend container (port 8080) với WebSocket
- Proxy `/live` → hls container (port 8081)

**Giải pháp:** Tạo file cấu hình nginx trên VPS.

## ✅ Các bước khắc phục

### Bước 1: Cấu hình Nginx trên VPS (Quan trọng nhất!)

SSH vào VPS và tạo file cấu hình:

```bash
ssh root@72.62.65.86

# Tạo file cấu hình nginx
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

# Test cấu hình
nginx -t

# Reload nginx
systemctl reload nginx

# Cài đặt SSL (nếu chưa có)
certbot --nginx -d gachoilongthansoi.com -d www.gachoilongthansoi.com
```

### Bước 2: Tạo file .env trên VPS

```bash
cd /var/www/livestream

cat > .env << 'EOL'
# Database
POSTGRES_DB=livestream_db
POSTGRES_USER=livestream_user
POSTGRES_PASSWORD=your_secure_password_here

# Backend
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/livestream_db
SPRING_DATASOURCE_USERNAME=livestream_user
SPRING_DATASOURCE_PASSWORD=your_secure_password_here
SPRING_REDIS_HOST=redis
SPRING_REDIS_PORT=6379
JWT_SECRET=your_jwt_secret_here
CORS_ALLOWED_ORIGINS=https://gachoilongthansoi.com

# Frontend (used in docker-compose)
VITE_API_URL=https://gachoilongthansoi.com/api
VITE_WS_URL=wss://gachoilongthansoi.com/ws/chat
VITE_HLS_BASE_URL=https://gachoilongthansoi.com/live

# Recording
RECORDING_BASE_PATH=/recordings
RECORDING_OUTPUT_PATH=/videos
RECORDING_VIDEO_URL_BASE=https://gachoilongthansoi.com/videos
RECORDING_THUMBNAIL_URL_BASE=https://gachoilongthansoi.com/videos/thumbnails
RECORDING_RETENTION_DAYS=30

# Docker Registry
DOCKER_REGISTRY=ghcr.io/your-username/your-repo
TAG=latest
EOL

# Đặt quyền file
chmod 600 .env
```

**Lưu ý:** Thay thế các giá trị:
- `your_secure_password_here` → mật khẩu thực tế
- `your_jwt_secret_here` → JWT secret key
- `your-username/your-repo` → tên repository GitHub của bạn

### Bước 3: Đảm bảo các file cấu hình có trên server

```bash
cd /var/www/livestream

# Kiểm tra các file cần thiết
ls -la srs.conf nginx-hls.conf docker-compose.prod.yml

# Nếu thiếu, copy từ repo hoặc tạo mới
```

### Bước 4: Cập nhật workflow (Tùy chọn - nếu muốn tự động hóa)

Workflow có thể được cập nhật để tự động copy file và tạo .env, nhưng cách thủ công ở trên đơn giản hơn cho lần đầu setup.

## ✅ Kiểm tra sau khi khắc phục

1. **Kiểm tra containers đang chạy:**
```bash
docker ps
```

2. **Kiểm tra logs:**
```bash
docker logs livestream-frontend
docker logs livestream-backend
docker logs livestream-srs
```

3. **Kiểm tra website:**
- Truy cập: https://gachoilongthansoi.com
- Kiểm tra API: https://gachoilongthansoi.com/api/swagger-ui.html
- Kiểm tra WebSocket: wss://gachoilongthansoi.com/ws/chat

4. **Kiểm tra nginx:**
```bash
        systemctl status nginx
nginx -t
```

## 🔍 Debug nếu vẫn có vấn đề

1. **Xem logs nginx:**
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

2. **Kiểm tra port đang listen:**
```bash
netstat -tlnp | grep -E '3000|8080|8081'
```

3. **Test kết nối từ VPS:**
```bash
curl http://localhost:3000
curl http://localhost:8080/api/health
curl http://localhost:8081
```
