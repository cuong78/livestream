# ⚡ QUICK REFERENCE - STREAMING FIX

## 🎯 **CÁC VẤN ĐỀ ĐÃ FIX**

| # | Vấn đề | Fix | File |
|---|--------|-----|------|
| 1 | Frontend không nhận build args | Thêm `ARG` và `ENV` trong Dockerfile | `livestream-frontend/Dockerfile` |
| 2 | CORS thiếu headers cho HLS | Thêm `Access-Control-Expose-Headers` | `nginx-prod.conf` |
| 3 | Backend trả HLS URL với localhost | Sửa default value thành domain thực | `application-prod.yml` |
| 4 | Thiếu env var `STREAM_HLS_BASE_URL` | Thêm vào `.env` trên VPS | `/opt/livestream-cicd/.env` |
| 5 | SRS path mapping | Không cần sửa - config đúng | `srs.conf` |

---

## 📋 **COMMANDS THƯỜNG DÙNG**

### **Trên Local:**
```bash
# Commit và push
git add .
git commit -m "fix: streaming configuration"
git push origin main
```

### **Trên VPS:**
```bash
# SSH vào VPS
ssh root@72.62.65.86

# Chuyển đến thư mục
cd /opt/livestream-cicd

# ──────── RESET SERVER ────────
bash reset-server.sh

# ──────── CHECK STATUS ────────
docker-compose -f docker-compose.cicd.yml ps
docker-compose -f docker-compose.cicd.yml logs -f

# ──────── RESTART SERVICES ────────
docker-compose -f docker-compose.cicd.yml restart
docker-compose -f docker-compose.cicd.yml restart backend
docker-compose -f docker-compose.cicd.yml restart frontend

# ──────── CHECK LOGS ────────
# All services
docker-compose -f docker-compose.cicd.yml logs -f

# Backend only
docker logs livestream-backend -f --tail 100

# Frontend only
docker logs livestream-frontend -f --tail 100

# SRS only
docker logs livestream-srs -f --tail 100

# Grep HLS URL in backend logs
docker logs livestream-backend | grep -i "hls"

# ──────── TEST ENDPOINTS ────────
# Backend health
curl http://localhost:8080/api/actuator/health

# Frontend
curl http://localhost:80

# HLS endpoint (when stream is live)
curl http://localhost:8080/hls/live/stream.m3u8

# ──────── CLEANUP ────────
# Remove old images
docker image prune -af

# Remove all stopped containers
docker container prune -f

# Full cleanup (CAREFUL!)
docker system prune -af --volumes
```

---

## 🔍 **KIỂM TRA NHANH**

### **1. Check Backend HLS URL:**
```bash
docker logs livestream-backend | grep "hlsUrl"
```
**Mong đợi:** `hlsUrl=https://anhcuong.space/hls/live/stream.m3u8`  
**❌ Lỗi nếu:** `hlsUrl=http://localhost:8081/live/stream.m3u8`

### **2. Check .env file:**
```bash
cat /opt/livestream-cicd/.env | grep STREAM_HLS
```
**Mong đợi:** `STREAM_HLS_BASE_URL=https://anhcuong.space/hls`  
**❌ Lỗi nếu:** không có dòng này

### **3. Check Nginx CORS:**
```bash
curl -I https://anhcuong.space/hls/live/stream.m3u8 | grep -i "access-control"
```
**Mong đợi:**
```
access-control-allow-origin: *
access-control-expose-headers: Content-Length,Content-Range,Accept-Ranges
```

### **4. Check Frontend build args:**
```bash
docker exec livestream-frontend env | grep VITE
```
**❌ Không dùng được** - Build args chỉ có lúc build, không có lúc runtime

**Thay vào đó, check image history:**
```bash
docker history ghcr.io/cuong78/livestream-frontend:latest | grep VITE
```

### **5. Check containers running:**
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
**Mong đợi:**
```
livestream-backend    Up 5 minutes    8080/tcp
livestream-frontend   Up 5 minutes    80/tcp, 443/tcp
livestream-srs        Up 5 minutes    1935/tcp, 1985/tcp, 8080/tcp
livestream-postgres   Up 5 minutes    5432/tcp
livestream-redis      Up 5 minutes    6379/tcp
```

---

## 🐛 **TROUBLESHOOTING QUICK FIXES**

### **Video không load:**
```bash
# 1. Check backend logs
docker logs livestream-backend | grep -i "error\|exception"

# 2. Check HLS URL
docker logs livestream-backend | grep "hlsUrl"

# 3. Restart backend nếu HLS URL sai
docker-compose -f docker-compose.cicd.yml restart backend
```

### **CORS error:**
```bash
# 1. Check Nginx config
docker exec livestream-frontend cat /etc/nginx/conf.d/default.conf | grep -A 5 "Access-Control"

# 2. Copy config mới nếu thiếu headers
scp nginx-prod.conf root@72.62.65.86:/opt/livestream-cicd/

# 3. Restart frontend
docker-compose -f docker-compose.cicd.yml restart frontend
```

### **404 Not Found (.m3u8):**
```bash
# 1. Check SRS có stream không
docker logs livestream-srs | tail -50

# 2. Check SRS files
docker exec livestream-srs ls -la /usr/local/srs/objs/nginx/html/live/

# 3. Test publish stream
ffmpeg -re -f lavfi -i testsrc=size=1280x720:rate=30 \
  -c:v libx264 -preset veryfast -b:v 2500k \
  -f flv rtmp://anhcuong.space:1935/live/test
```

### **Backend không kết nối DB:**
```bash
# 1. Check Postgres
docker logs livestream-postgres | tail -20

# 2. Check backend connection
docker logs livestream-backend | grep -i "database\|postgres"

# 3. Restart stack
docker-compose -f docker-compose.cicd.yml restart
```

---

## 📁 **FILE LOCATIONS**

### **Trên VPS:**
```
/opt/livestream-cicd/
├── .env                        ← Environment variables
├── docker-compose.cicd.yml     ← Docker Compose config
├── nginx-prod.conf             ← Nginx configuration
├── srs.conf                    ← SRS configuration
├── reset-server.sh             ← Reset script
└── backups/                    ← Database backups
```

### **SSL Certificates:**
```
/etc/letsencrypt/live/anhcuong.space/
├── fullchain.pem
├── privkey.pem
└── ...
```

### **SRS HLS Files:**
```
# Inside container:
/usr/local/srs/objs/nginx/html/
└── live/
    ├── stream.m3u8
    ├── stream-0.ts
    ├── stream-1.ts
    └── ...

# Check:
docker exec livestream-srs ls -la /usr/local/srs/objs/nginx/html/live/
```

---

## 🔐 **GENERATE SECRETS**

```bash
# Database Password
openssl rand -base64 32

# Redis Password
openssl rand -base64 32

# JWT Secret (PHẢI trên 1 dòng)
openssl rand -base64 64 | tr -d '\n'
```

---

## 📊 **TEST STREAMING**

### **OBS Studio:**
```
Server: rtmp://anhcuong.space:1935/live
Stream Key: YOUR_STREAM_KEY
```

### **FFmpeg:**
```bash
ffmpeg -re -i test-video.mp4 \
  -c:v libx264 -preset veryfast -b:v 2500k \
  -c:a aac -b:a 128k \
  -f flv rtmp://anhcuong.space:1935/live/YOUR_STREAM_KEY
```

### **Test HLS:**
```bash
# Get m3u8 playlist
curl https://anhcuong.space/hls/live/stream.m3u8

# Test in browser console
fetch('https://anhcuong.space/hls/live/stream.m3u8')
  .then(r => r.text())
  .then(console.log)
```

---

## 🚀 **DEPLOYMENT WORKFLOW**

```
1. Local: git push origin main
   ↓
2. GitHub Actions: Build images
   ↓
3. GitHub Actions: Push to GHCR
   ↓
4. GitHub Actions: SSH to VPS
   ↓
5. VPS: Pull new images
   ↓
6. VPS: docker-compose down
   ↓
7. VPS: docker-compose up -d
   ↓
8. VPS: Health check
   ↓
9. ✅ Deployment complete
```

**Thời gian:** ~5-7 phút

---

## 📞 **IMPORTANT URLS**

| Service | Local (Dev) | Production |
|---------|-------------|------------|
| Frontend | http://localhost:3000 | https://anhcuong.space |
| Backend API | http://localhost:8080/api | https://anhcuong.space/api |
| WebSocket | ws://localhost:8080/api/ws | wss://anhcuong.space/api/ws |
| HLS Streaming | http://localhost:8081 | https://anhcuong.space/hls |
| RTMP Publish | rtmp://localhost:1935/live | rtmp://anhcuong.space:1935/live |
| Swagger UI | http://localhost:8080/api/swagger-ui.html | ❌ Disabled |
| SRS API | http://localhost:1985/api/v1/ | http://VPS_IP:1985/api/v1/ |

---

## ✅ **CHECKLIST DEPLOY**

### **Trước khi deploy:**
- [ ] `.env` file đã tạo trên VPS
- [ ] Tất cả secrets đã generate
- [ ] Domain đúng trong `.env`
- [ ] `STREAM_HLS_BASE_URL` có trong `.env`
- [ ] SSL certificate còn hạn
- [ ] GitHub Secrets đã đủ

### **Sau khi deploy:**
- [ ] Containers đang chạy: `docker ps`
- [ ] Không có error trong logs
- [ ] Backend health check: 200 OK
- [ ] Frontend accessible: 200 OK
- [ ] WebSocket connected
- [ ] Test publish stream thành công

---

## 🎯 **KẾT QUẢ MONG ĐỢI**

```bash
# Backend logs
✅ Started LiveStreamApplication in X.XXX seconds
✅ Stream started successfully... hlsUrl=https://anhcuong.space/hls/live/stream.m3u8

# Frontend (Browser console)
✅ Video metadata loaded
✅ Playing...
✅ WebSocket connected

# Nginx logs
✅ GET /hls/live/stream.m3u8 → 200
✅ GET /hls/live/stream-0.ts → 200
```

---

**📌 Bookmark trang này để tham khảo nhanh!**
