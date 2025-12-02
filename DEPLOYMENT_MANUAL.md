# 🚀 Manual Deployment Guide - CLB Gà Chọi Cao Đổi Live Streaming

Hướng dẫn chi tiết từng bước để deploy ứng dụng live streaming lên production server.

---

## 📋 **Yêu cầu trước khi bắt đầu**

### **1. Infrastructure**

- ✅ VPS: 4GB RAM, 2 vCPU, 100GB SSD (Hostinger VPS 2 hoặc tương đương)
- ✅ Domain: Đã mua và đăng ký (ví dụ: `anhcuong.space`)
- ✅ CloudFlare account (Free plan)

### **2. Kiến thức cần có**

- SSH vào VPS
- Sử dụng nano/vim editor
- Hiểu cơ bản về Docker & Docker Compose
- Git cơ bản

---

## 🎯 **Tổng quan quy trình**

```
1. Mua VPS + Domain (Hostinger)
2. Setup CloudFlare
3. Đổi Nameservers
4. Cài đặt Docker trên VPS
5. Clone code từ GitHub
6. Cấu hình environment variables
7. Deploy với HTTP trước
8. Generate SSL Certificate
9. Deploy với HTTPS
10. Bật CloudFlare Proxy
```

**Tổng thời gian:** ~2-3 giờ (không tính DNS propagate)

---

## 📝 **BƯỚC 1: MUA & SETUP INFRASTRUCTURE**

### **1.1. Mua VPS từ Hostinger**

1. Truy cập: https://www.hostinger.vn/vps-hosting
2. Chọn **VPS 2** (hoặc cao hơn):
   - 4GB RAM
   - 2 vCPU
   - 100GB SSD
   - ~$8.99/tháng
3. Chọn location: **Singapore** (latency thấp cho VN)
4. OS: **Ubuntu 22.04 LTS**
5. Lưu lại:
   - ✅ **IP Address VPS**
   - ✅ **Root Password**

### **1.2. Mua Domain**

1. Tại Hostinger Dashboard → Domains
2. Mua domain `.vn` hoặc `.com` (~$10/năm)
3. Lưu lại: **Domain name**

### **1.3. Đăng ký CloudFlare**

1. Truy cập: https://dash.cloudflare.com/sign-up
2. Đăng ký tài khoản miễn phí
3. Add domain vào CloudFlare:
   - Click **"Add a Site"**
   - Nhập domain của bạn
   - Chọn **Free plan**
4. CloudFlare sẽ quét DNS và cho bạn **2 nameservers**, ví dụ:
   ```
   dave.ns.cloudflare.com
   mckinley.ns.cloudflare.com
   ```
5. **LƯU LẠI 2 NAMESERVERS NÀY!**

### **1.4. Đổi Nameservers tại Hostinger**

1. Vào Hostinger Dashboard → Domains
2. Click vào domain của bạn
3. Click **"Thay đổi máy chủ tên miền"** (Change Nameservers)
4. Chọn **"Sử dụng máy chủ tên miền tùy chỉnh"**
5. Nhập 2 nameservers từ CloudFlare
6. Click **Save**
7. **Chờ 2-24 giờ** để DNS propagate (thường 2-4 giờ)

### **1.5. Cấu hình DNS Records trong CloudFlare**

**QUAN TRỌNG:** Trước khi deploy, tạm thời **TẮT Proxy** (Gray Cloud)

1. CloudFlare Dashboard → DNS → Records
2. Add/Edit records:

| Type | Name | Content    | Proxy Status       | TTL  |
| ---- | ---- | ---------- | ------------------ | ---- |
| A    | @    | `<IP_VPS>` | ☁️ DNS only (Gray) | Auto |
| A    | www  | `<IP_VPS>` | ☁️ DNS only (Gray) | Auto |

**Lưu ý:** Bật Proxy (Orange Cloud) SAU KHI đã có SSL!

---

## 🔧 **BƯỚC 2: SETUP VPS**

### **2.1. SSH vào VPS**

**Từ Windows:**

```powershell
ssh root@<IP_VPS>
# Nhập password khi được hỏi
```

**Hoặc dùng PuTTY:** https://www.putty.org/

### **2.2. Update hệ thống**

```bash
apt update && apt upgrade -y
```

### **2.3. Cài đặt Docker**

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verify
docker --version
# Output: Docker version 24.x.x
```

### **2.4. Cài đặt Docker Compose**

```bash
# Install Docker Compose
apt install docker-compose -y

# Verify
docker-compose --version
# Output: docker-compose version 1.29.x
```

### **2.5. Cài đặt Git**

```bash
apt install git -y
git --version
```

### **2.6. Cấu hình Firewall (UFW)**

```bash
# Enable firewall
ufw enable

# Allow ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 1935/tcp  # RTMP

# Verify
ufw status
```

### **2.7. Tạo user non-root (Optional, bảo mật tốt hơn)**

```bash
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy
```

---

## 📦 **BƯỚC 3: CLONE CODE & SETUP**

### **3.1. Clone repository**

```bash
# Tạo thư mục project
mkdir -p /opt/livestream
cd /opt/livestream

# Clone code từ GitHub
git clone https://github.com/cuong78/livestream.git .

# Verify
ls -la
# Phải thấy: docker-compose.prod.yml, nginx-prod.conf, etc.
```

### **3.2. Tạo file `.env`**

```bash
cd /opt/livestream
nano .env
```

**Copy nội dung sau và SỬA CÁC GIÁ TRỊ:**

```env
# Database
DB_NAME=livestream_db
DB_USERNAME=livestream_user
DB_PASSWORD=<CHANGE_ME>
DB_URL=jdbc:postgresql://postgres:5432/livestream_db

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<CHANGE_ME>

# JWT Secret (Generate: openssl rand -base64 64)
JWT_SECRET=<CHANGE_ME>
JWT_EXPIRATION=3600000

# Domain (Đổi thành domain thật của bạn)
DOMAIN=yourdomain.com

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Frontend URLs
VITE_API_URL=https://yourdomain.com/api
VITE_WS_URL=wss://yourdomain.com/api/ws
VITE_HLS_BASE_URL=https://yourdomain.com/hls

# Stream URLs
STREAM_RTMP_URL=rtmp://yourdomain.com:1935/live
STREAM_HLS_BASE_URL=https://yourdomain.com/hls
```

**Generate secrets:**

```bash
# Database Password
openssl rand -base64 32

# Redis Password
openssl rand -base64 32

# JWT Secret
openssl rand -base64 64
```

**Lưu file:** `Ctrl+X` → `Y` → `Enter`

### **3.3. Verify .env không bị commit lên Git**

```bash
cat .gitignore | grep .env
# Phải thấy: .env
```

---

## 🔨 **BƯỚC 4: DEPLOY VỚI HTTP (Tạm thời)**

**Lý do:** Cần chạy HTTP trước để generate SSL certificate

### **4.1. Tạo Nginx config HTTP-only**

```bash
cd /opt/livestream
nano nginx-http-temp.conf
```

**Copy nội dung:**

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;
    keepalive_timeout 65;
    client_max_body_size 100M;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    upstream backend {
        server backend:8080;
    }

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /api/ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        location /hls/ {
            proxy_pass http://srs:8080/;
            add_header Cache-Control "no-cache";
            add_header Access-Control-Allow-Origin "*";
        }
    }
}
```

**Đổi `yourdomain.com` thành domain thật!**

**Lưu:** `Ctrl+X` → `Y` → `Enter`

### **4.2. Sửa docker-compose.prod.yml**

```bash
nano docker-compose.prod.yml
```

**TÌM phần frontend (~line 85), SỬA:**

```yaml
volumes:
  - ./nginx-http-temp.conf:/etc/nginx/nginx.conf:ro # ← Dùng HTTP config
  # - /etc/letsencrypt:/etc/letsencrypt:ro           # ← Comment SSL mount
```

**Comment port 443:**

```yaml
ports:
  - "80:80"
  # - "443:443"  # ← Comment tạm thời
```

**Lưu:** `Ctrl+X` → `Y` → `Enter`

### **4.3. Sửa CPU limits cho VPS 2 vCPU**

```bash
nano docker-compose.prod.yml
```

**TÌM phần SRS service (~line 50), SỬA:**

```yaml
srs:
  deploy:
    resources:
      limits:
        cpus: "1" # Giảm từ 4 xuống 1
        memory: 1G # Giảm từ 4G xuống 1G
      reservations:
        cpus: "0.5" # Giảm từ 2 xuống 0.5
        memory: 512M
```

**TÌM phần backend (~line 80), SỬA:**

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: "1" # Giảm từ 2 xuống 1
        memory: 1.5G # Giảm từ 2G xuống 1.5G
      reservations:
        cpus: "0.5"
        memory: 1G
```

**Lưu:** `Ctrl+X` → `Y` → `Enter`

### **4.4. Deploy**

```bash
cd /opt/livestream

# Build và start containers
docker-compose -f docker-compose.prod.yml up -d --build

# Xem logs (Ctrl+C để thoát)
docker-compose -f docker-compose.prod.yml logs -f

# Verify containers đang chạy
docker ps
```

**Phải thấy 5 containers:**

- livestream-frontend
- livestream-backend
- livestream-postgres
- livestream-redis
- livestream-srs

### **4.5. Test HTTP**

```bash
# Test từ VPS
curl -I http://localhost
# Phải thấy: HTTP/1.1 200 OK

# Test từ trình duyệt
# Mở: http://yourdomain.com
```

**Nếu thấy website → HTTP OK!** ✅

---

## 🔐 **BƯỚC 5: SETUP SSL CERTIFICATE**

### **5.1. Cài đặt Certbot**

```bash
apt update
apt install certbot -y
certbot --version
```

### **5.2. Dừng Nginx tạm thời**

```bash
docker stop livestream-frontend
```

### **5.3. Generate SSL Certificate**

```bash
certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --non-interactive \
  --agree-tos \
  --email your-email@gmail.com
```

**Thay:**

- `yourdomain.com` → Domain thật
- `your-email@gmail.com` → Email thật

**Kết quả thành công:**

```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/yourdomain.com/fullchain.pem
Key is saved at: /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### **5.4. Verify SSL Certificate**

```bash
# Kiểm tra certificate
certbot certificates

# Phải thấy:
# Certificate Name: yourdomain.com
# Expiry Date: ... (VALID: 89 days)

# Kiểm tra files
ls -la /etc/letsencrypt/live/yourdomain.com/
# Phải thấy: fullchain.pem, privkey.pem
```

---

## 🚀 **BƯỚC 6: DEPLOY VỚI HTTPS**

### **6.1. Sửa docker-compose.prod.yml**

```bash
cd /opt/livestream
nano docker-compose.prod.yml
```

**TÌM phần frontend, SỬA:**

```yaml
ports:
  - "80:80"
  - "443:443" # ← UNCOMMENT
volumes:
  - ./nginx-prod.conf:/etc/nginx/nginx.conf:ro # ← Đổi sang prod config
  - /etc/letsencrypt:/etc/letsencrypt:ro # ← UNCOMMENT
```

**Lưu:** `Ctrl+X` → `Y` → `Enter`

### **6.2. Verify nginx-prod.conf có đúng domain**

```bash
nano nginx-prod.conf
```

**Tìm và sửa:**

```nginx
server_name yourdomain.com www.yourdomain.com;  # ← Đổi thành domain thật

ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;      # ← Đổi
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;   # ← Đổi
```

**Lưu:** `Ctrl+X` → `Y` → `Enter`

### **6.3. Deploy lại với HTTPS**

```bash
cd /opt/livestream

# Rebuild frontend
docker-compose -f docker-compose.prod.yml up -d --build

# Xem logs
docker-compose -f docker-compose.prod.yml logs -f frontend

# Chờ thấy: "Configuration complete; ready for start up"
```

### **6.4. Test HTTPS**

```bash
# Test HTTP redirect
curl -I http://localhost
# Phải thấy: 301 Moved Permanently → https://

# Test từ trình duyệt (với domain thật)
# Mở: https://yourdomain.com
```

**Nếu vẫn thấy Error 521 → Bật CloudFlare Proxy ở bước tiếp theo**

---

## ☁️ **BƯỚC 7: BẬT CLOUDFLARE PROXY**

### **7.1. Bật Proxy**

1. CloudFlare Dashboard → DNS → Records
2. Click **Gray Cloud** ☁️ bên cạnh `yourdomain.com`
3. Chuyển thành **Orange Cloud** ☁️ (Proxied)
4. Làm tương tự với `www`
5. Chờ 2-3 phút

### **7.2. Cấu hình CloudFlare SSL Mode**

1. CloudFlare Dashboard → SSL/TLS → Overview
2. Chọn **"Full (strict)"**
3. Click **Save**

### **7.3. Cấu hình CloudFlare Page Rules (Optional - Performance)**

1. CloudFlare Dashboard → Rules → Page Rules
2. Create Rule:
   - URL: `*yourdomain.com/hls/*`
   - Settings:
     - Cache Level: Cache Everything
     - Edge Cache TTL: 2 minutes
3. Click **Save and Deploy**

---

## ✅ **BƯỚC 8: VERIFY DEPLOYMENT**

### **8.1. Test HTTPS**

Mở trình duyệt:

1. ✅ **https://yourdomain.com** → Phải thấy 🔒 màu xanh
2. ✅ **http://yourdomain.com** → Tự động redirect sang HTTPS
3. ✅ Test chat real-time
4. ✅ Test admin login:
   - URL: `/admin/login`
   - Default: `admin/admin` (ĐỔI NGAY!)

### **8.2. Test RTMP Streaming**

**Từ điện thoại:**

1. Cài app: **Larix Broadcaster** (Android) hoặc **RTMP Camera** (iOS)
2. Settings:
   - Server URL: `rtmp://yourdomain.com:1935/live`
   - Stream Key: Lấy từ admin dashboard
3. Start streaming
4. Verify: Mở `https://yourdomain.com` để xem stream

### **8.3. Test HLS Playback**

```bash
# VLC Player: Open Network Stream
https://yourdomain.com/hls/{stream_key}.m3u8
```

---

## 🔄 **BƯỚC 9: SETUP AUTO-RENEWAL SSL**

### **9.1. Test renewal process**

```bash
certbot renew --dry-run
# Phải thấy: Congratulations, all simulated renewals succeeded
```

### **9.2. Setup Cron Job**

```bash
# Mở crontab editor
crontab -e

# Chọn editor nano (nhấn 1)

# Thêm dòng này vào cuối file:
0 3 * * * certbot renew --quiet --deploy-hook "docker restart livestream-frontend"

# Lưu: Ctrl+X → Y → Enter

# Verify
crontab -l
```

**Cron job sẽ chạy lúc 3h sáng mỗi ngày để renew SSL (khi còn < 30 ngày)**

---

## 📊 **BƯỚC 10: MONITORING & MAINTENANCE**

### **10.1. Xem logs**

```bash
cd /opt/livestream

# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f backend
```

### **10.2. Restart services**

```bash
# Restart all
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart frontend
```

### **10.3. Backup database**

```bash
cd /opt/livestream

# Run backup script
chmod +x backup.sh
./backup.sh

# Backups sẽ được lưu tại: /opt/livestream/backups/
```

### **10.4. Update code**

```bash
cd /opt/livestream

# Pull latest code
git pull origin main

# Rebuild và restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 🐛 **TROUBLESHOOTING**

### **Lỗi: Port 80/443 already in use**

```bash
# Kiểm tra process đang dùng port
lsof -i :80
lsof -i :443

# Kill process
kill -9 <PID>
```

### **Lỗi: SSL certificate not found**

```bash
# Verify certificate exists
ls -la /etc/letsencrypt/live/yourdomain.com/

# Regenerate nếu cần
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com --force-renewal
```

### **Lỗi: Container crash**

```bash
# Xem logs
docker-compose -f docker-compose.prod.yml logs <service_name>

# Restart container
docker-compose -f docker-compose.prod.yml restart <service_name>
```

### **Lỗi: Out of memory**

```bash
# Check memory usage
free -h

# Check Docker stats
docker stats

# Restart Docker
systemctl restart docker
```

### **Website slow**

1. Check CloudFlare cache settings
2. Enable CloudFlare Page Rules
3. Upgrade VPS plan

---

## 📝 **CHECKLIST DEPLOYMENT**

```
☐ 1. Mua VPS + Domain
☐ 2. Setup CloudFlare
☐ 3. Đổi Nameservers
☐ 4. Chờ DNS propagate (2-4 giờ)
☐ 5. SSH vào VPS
☐ 6. Cài Docker + Docker Compose
☐ 7. Clone code từ GitHub
☐ 8. Tạo file .env
☐ 9. Deploy với HTTP
☐ 10. Test HTTP hoạt động
☐ 11. Generate SSL Certificate
☐ 12. Deploy với HTTPS
☐ 13. Bật CloudFlare Proxy
☐ 14. Test HTTPS với 🔒
☐ 15. Setup Auto-Renewal
☐ 16. Test RTMP streaming
☐ 17. Test chat real-time
☐ 18. ĐỔI PASSWORD ADMIN!
```

---

## 💰 **CHI PHÍ DỰ TÍNH**

| Hạng mục              | Giá           | Chu kỳ                   |
| --------------------- | ------------- | ------------------------ |
| VPS Hostinger (VPS 2) | $8.99         | /tháng                   |
| Domain `.com`         | ~$10          | /năm                     |
| CloudFlare            | $0            | Miễn phí                 |
| SSL Certificate       | $0            | Miễn phí (Let's Encrypt) |
| **TỔNG tháng đầu**    | **~$19**      |                          |
| **TỔNG từ tháng 2**   | **~$9/tháng** |                          |

---

## 🎯 **NEXT STEPS**

Sau khi manual deployment thành công:

1. ✅ **Backup database định kỳ** (cron job)
2. ✅ **Monitor server resources**
3. ✅ **Setup alerts** (email/Slack khi server down)
4. 🚀 **Chuyển sang CI/CD** để tự động deploy (xem: `DEPLOYMENT_CICD.md`)

---

## 📞 **SUPPORT**

- GitHub Issues: https://github.com/cuong78/livestream/issues
- Email: cuongcaoleanh@gmail.com
- Facebook: [Anh Cương](https://www.facebook.com/ang.cuong.77)

---

**🎊 CHÚC MỪNG BẠN ĐÃ DEPLOY THÀNH CÔNG!**
