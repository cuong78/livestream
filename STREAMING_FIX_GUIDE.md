# 🔧 HƯỚNG DẪN FIX LỖI STREAMING

## 🔴 **TÓM TẮT VẤN ĐỀ**

Livestream bị lỗi trên production do **5 vấn đề cấu hình sai**:

1. ❌ **HLS URL sai**: Backend trả về `localhost:8081` thay vì domain thực
2. ❌ **CORS thiếu headers**: Video.js cần thêm `Range`, `Accept-Ranges`, `Content-Range`
3. ❌ **Frontend build args không được inject**: Biến `VITE_*` không có trong build
4. ❌ **SRS path mapping**: HLS files path không khớp với Nginx proxy
5. ❌ **Environment variables thiếu**: Backend không biết `STREAM_HLS_BASE_URL`

---

## ✅ **GIẢI PHÁP ĐÃ THỰC HIỆN**

### **1. Cập nhật Frontend Dockerfile**
```dockerfile
# ✨ Thêm ARG để nhận build arguments từ GitHub Actions
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_HLS_BASE_URL

# ✨ Set environment variables cho Vite build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
ENV VITE_HLS_BASE_URL=${VITE_HLS_BASE_URL}

# ✨ Tạo .env file cho Vite
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env && \
    echo "VITE_WS_URL=${VITE_WS_URL}" >> .env && \
    echo "VITE_HLS_BASE_URL=${VITE_HLS_BASE_URL}" >> .env
```

### **2. Cập nhật Nginx CORS Headers**
```nginx
# ✨ Thêm headers cần thiết cho HLS streaming
add_header Access-Control-Allow-Headers "Range,If-Range,Accept-Ranges,..." always;
add_header Access-Control-Expose-Headers "Content-Length,Content-Range,Accept-Ranges" always;
```

### **3. Cập nhật Backend Application Config**
```yaml
stream:
  rtmp:
    url: ${STREAM_RTMP_URL:rtmp://srs:1935/live}
  hls:
    base-url: ${STREAM_HLS_BASE_URL:https://anhcuong.space/hls}  # ✨ Sử dụng domain thực
```

### **4. Cập nhật .env.example**
```bash
# ✨ Thêm biến mới
STREAM_RTMP_URL=rtmp://srs:1935/live
STREAM_HLS_BASE_URL=https://anhcuong.space/hls
```

---

## 🚀 **CÁCH DEPLOY LẠI**

### **OPTION 1: Deploy qua GitHub Actions (Khuyến nghị)**

#### **Bước 1: Khôi phục server về trạng thái ban đầu**

SSH vào VPS và chạy:

```bash
# Copy script reset-server.sh lên VPS
scp reset-server.sh root@72.62.65.86:/opt/livestream-cicd/

# SSH vào VPS
ssh root@72.62.65.86

# Chuyển đến thư mục
cd /opt/livestream-cicd

# Chạy script reset (xóa toàn bộ containers, images, volumes)
chmod +x reset-server.sh
bash reset-server.sh
```

Xác nhận `yes` khi được hỏi.

#### **Bước 2: Cập nhật file .env trên VPS**

```bash
nano /opt/livestream-cicd/.env
```

Paste nội dung sau (thay thế secrets):

```bash
# Database Configuration
DB_NAME=livestream_db
DB_USERNAME=livestream_user
DB_PASSWORD=<RUN: openssl rand -base64 32>
DB_URL=jdbc:postgresql://postgres:5432/livestream_db

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<RUN: openssl rand -base64 32>

# JWT Configuration
JWT_SECRET=<RUN: openssl rand -base64 64 | tr -d '\n'>
JWT_EXPIRATION=86400000

# CORS Configuration
CORS_ORIGINS=https://anhcuong.space,https://www.anhcuong.space

# Domain Configuration
DOMAIN=anhcuong.space

# Frontend Build Arguments
VITE_API_URL=https://anhcuong.space/api
VITE_WS_URL=wss://anhcuong.space/api/ws
VITE_HLS_BASE_URL=https://anhcuong.space/hls

# ✨ NEW: Streaming Configuration
STREAM_RTMP_URL=rtmp://srs:1935/live
STREAM_HLS_BASE_URL=https://anhcuong.space/hls
```

**Generate secrets:**
```bash
# Database Password
openssl rand -base64 32

# Redis Password
openssl rand -base64 32

# JWT Secret (PHẢI trên 1 dòng)
openssl rand -base64 64 | tr -d '\n'
```

Lưu file: `Ctrl+O`, `Enter`, `Ctrl+X`

#### **Bước 3: Verify .env file**

```bash
cat /opt/livestream-cicd/.env
```

Kiểm tra:
- ✅ Không còn `<RUN: ...>`
- ✅ `JWT_SECRET` trên 1 dòng
- ✅ Domain đúng (`anhcuong.space`)
- ✅ Có biến `STREAM_HLS_BASE_URL`

#### **Bước 4: Push code lên GitHub**

Trên máy local:

```bash
cd d:/github/liveStream

# Add các file đã sửa
git add .

# Commit với message rõ ràng
git commit -m "fix: Sửa lỗi streaming - cập nhật HLS URL và CORS headers"

# Push lên GitHub
git push origin main
```

#### **Bước 5: Theo dõi GitHub Actions**

1. Vào GitHub repository: `https://github.com/cuong78/livestream`
2. Click tab **Actions**
3. Xem workflow `Deploy to Production` đang chạy
4. Chờ workflow hoàn thành (khoảng 5-7 phút)

#### **Bước 6: Verify deployment trên VPS**

SSH vào VPS:

```bash
ssh root@72.62.65.86

cd /opt/livestream-cicd

# Kiểm tra containers
docker-compose -f docker-compose.cicd.yml ps

# Kiểm tra logs
docker-compose -f docker-compose.cicd.yml logs -f backend
docker-compose -f docker-compose.cicd.yml logs -f frontend
docker-compose -f docker-compose.cicd.yml logs -f srs

# Test backend API
curl http://localhost:8080/api/actuator/health

# Test frontend
curl http://localhost:80

# Test HLS endpoint (khi có stream)
curl http://localhost:8080/hls/live/stream.m3u8
```

---

### **OPTION 2: Deploy thủ công trên VPS**

Nếu không muốn dùng GitHub Actions:

```bash
ssh root@72.62.65.86
cd /opt/livestream-cicd

# Reset server
bash reset-server.sh

# Login vào GHCR
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u cuong78 --password-stdin

# Pull images mới nhất
docker pull ghcr.io/cuong78/livestream-backend:latest
docker pull ghcr.io/cuong78/livestream-frontend:latest

# Start containers
docker-compose -f docker-compose.cicd.yml up -d

# Theo dõi logs
docker-compose -f docker-compose.cicd.yml logs -f
```

---

## 🧪 **TEST STREAMING**

### **1. Test RTMP Publishing**

Sử dụng OBS hoặc FFmpeg để test RTMP:

**OBS Studio:**
```
Server: rtmp://anhcuong.space:1935/live
Stream Key: <YOUR_STREAM_KEY>
```

**FFmpeg:**
```bash
ffmpeg -re -i test-video.mp4 \
  -c:v libx264 -preset veryfast -b:v 2500k -maxrate 2500k -bufsize 5000k \
  -c:a aac -b:a 128k -ar 44100 \
  -f flv rtmp://anhcuong.space:1935/live/YOUR_STREAM_KEY
```

### **2. Test HLS Playback**

**Browser Console:**
```javascript
// Mở https://anhcuong.space
// Mở Developer Tools (F12)
// Chạy command sau:

fetch('https://anhcuong.space/hls/live/stream.m3u8')
  .then(r => r.text())
  .then(console.log)
  .catch(console.error)
```

Kết quả mong đợi:
```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:2
#EXTINF:2.000,
live/stream-0.ts
#EXTINF:2.000,
live/stream-1.ts
...
```

### **3. Test CORS Headers**

```bash
curl -H "Origin: https://anhcuong.space" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Range" \
     -X OPTIONS \
     -I https://anhcuong.space/hls/live/stream.m3u8
```

Kết quả mong đợi:
```
HTTP/2 204
access-control-allow-origin: *
access-control-allow-methods: GET, HEAD, OPTIONS
access-control-allow-headers: Range,If-Range,Accept-Ranges,...
```

---

## 📊 **KIỂM TRA BACKEND LOGS**

### **1. Kiểm tra Backend tạo HLS URL đúng**

```bash
docker-compose -f docker-compose.cicd.yml logs backend | grep -i "hls"
```

Kết quả mong đợi:
```
Stream started successfully... hlsUrl=https://anhcuong.space/hls/live/stream.m3u8
```

❌ **LỖI nếu thấy:**
```
hlsUrl=http://localhost:8081/live/stream.m3u8
```

➡️ **Fix:** Kiểm tra lại biến `STREAM_HLS_BASE_URL` trong `.env`

### **2. Kiểm tra SRS callbacks**

```bash
docker-compose -f docker-compose.cicd.yml logs backend | grep -i "callback"
```

Kết quả mong đợi:
```
SRS Publish callback: {stream=stream, app=live, ...}
Stream started successfully for user: admin
```

---

## 🐛 **TROUBLESHOOTING**

### **Lỗi 1: Video không load**

**Triệu chứng:**
- Video player hiển thị "Loading..."
- Console error: `Failed to load resource: net::ERR_NAME_NOT_RESOLVED`

**Nguyên nhân:**
- HLS URL sai (localhost thay vì domain)

**Fix:**
```bash
# Kiểm tra backend logs
docker logs livestream-backend | grep "hlsUrl"

# Nếu thấy localhost, restart backend với .env đúng
docker-compose -f docker-compose.cicd.yml restart backend
```

### **Lỗi 2: CORS error**

**Triệu chứng:**
- Console error: `Access to XMLHttpRequest... blocked by CORS policy`

**Fix:**
```bash
# Kiểm tra Nginx config
docker exec livestream-frontend cat /etc/nginx/conf.d/default.conf | grep -A 5 "Access-Control"

# Nếu thiếu headers, copy nginx-prod.conf mới lên
scp nginx-prod.conf root@72.62.65.86:/opt/livestream-cicd/

# Restart frontend
docker-compose -f docker-compose.cicd.yml restart frontend
```

### **Lỗi 3: .m3u8 file 404**

**Triệu chứng:**
- Browser: `GET https://anhcuong.space/hls/live/stream.m3u8` → 404

**Nguyên nhân:**
- Chưa có stream đang phát
- SRS chưa tạo HLS files

**Fix:**
```bash
# Kiểm tra SRS logs
docker logs livestream-srs

# Kiểm tra HLS files trong SRS container
docker exec livestream-srs ls -la /usr/local/srs/objs/nginx/html/live/

# Test publish stream
ffmpeg -re -f lavfi -i testsrc=size=1280x720:rate=30 \
  -f flv rtmp://anhcuong.space:1935/live/test
```

### **Lỗi 4: Build GitHub Actions failed**

**Triệu chứng:**
- GitHub Actions workflow màu đỏ

**Fix:**
```bash
# Kiểm tra logs trong GitHub Actions
# Click vào workflow failed → Xem log chi tiết

# Thường do:
# 1. Secrets chưa đủ (VPS_HOST, SSH_PRIVATE_KEY, etc.)
# 2. VPS không SSH được
# 3. Docker build lỗi

# Test SSH từ local
ssh -i ~/.ssh/github_actions root@72.62.65.86
```

---

## 📝 **CHECKLIST TRƯỚC KHI DEPLOY**

Đánh dấu các bước đã hoàn thành:

### **Trên VPS:**
- [ ] File `.env` đã tạo tại `/opt/livestream-cicd/.env`
- [ ] Tất cả secrets đã generate (không còn `<RUN: ...>`)
- [ ] `JWT_SECRET` trên 1 dòng (không có line break)
- [ ] Domain đúng trong `.env` (`anhcuong.space`)
- [ ] Biến `STREAM_HLS_BASE_URL` có trong `.env`
- [ ] SSL certificate còn hạn (`/etc/letsencrypt/live/anhcuong.space/`)
- [ ] Docker daemon đang chạy (`docker ps`)
- [ ] Đã login GHCR (`docker login ghcr.io`)

### **Trên GitHub:**
- [ ] Secrets đã đủ (VPS_HOST, SSH_PRIVATE_KEY, DOMAIN, VITE_*, etc.)
- [ ] Repository settings → Actions → Enabled
- [ ] Code đã push lên `main` branch
- [ ] Workflow file `.github/workflows/deploy.yml` tồn tại

### **Trên Local:**
- [ ] Đã sửa `livestream-frontend/Dockerfile` (thêm ARG)
- [ ] Đã sửa `nginx-prod.conf` (thêm CORS headers)
- [ ] Đã sửa `application-prod.yml` (STREAM_HLS_BASE_URL)
- [ ] Đã commit và push code
- [ ] Không có lỗi syntax (checked)

---

## 🎯 **KẾT QUẢ MONG ĐỢI**

Sau khi deploy thành công:

### **1. Frontend**
- ✅ Truy cập `https://anhcuong.space` → Website load
- ✅ Không có CORS error trong console
- ✅ API calls thành công (`/api/stream/current`)

### **2. Backend**
- ✅ Health check: `https://anhcuong.space/api/actuator/health` → `{"status":"UP"}`
- ✅ WebSocket: `wss://anhcuong.space/api/ws/chat` → Connected
- ✅ Logs không có error

### **3. Streaming**
- ✅ Publish RTMP → Backend nhận callback
- ✅ HLS URL tạo đúng: `https://anhcuong.space/hls/live/stream.m3u8`
- ✅ Video player load và play stream

### **4. SRS**
- ✅ RTMP accept connection: `rtmp://anhcuong.space:1935/live`
- ✅ HLS files được tạo trong `/usr/local/srs/objs/nginx/html/live/`
- ✅ HTTP API: `http://localhost:1985/api/v1/streams/` → Danh sách streams

---

## 📞 **HỖ TRỢ**

Nếu gặp vấn đề:

1. **Kiểm tra logs:**
   ```bash
   docker-compose -f docker-compose.cicd.yml logs -f
   ```

2. **Kiểm tra containers:**
   ```bash
   docker-compose -f docker-compose.cicd.yml ps
   ```

3. **Restart services:**
   ```bash
   docker-compose -f docker-compose.cicd.yml restart
   ```

4. **Xem thông tin debug:**
   - Backend: `https://anhcuong.space/api/actuator/health`
   - Frontend: Browser Developer Tools (F12) → Console
   - SRS: `http://VPS_IP:1985/api/v1/streams/`

---

## 🔄 **ROLLBACK NẾU CẦN**

Nếu deployment mới bị lỗi, rollback về version cũ:

```bash
ssh root@72.62.65.86
cd /opt/livestream-cicd

# Pull image cũ (thay SHA bằng commit cũ)
docker pull ghcr.io/cuong78/livestream-backend:main-abc1234
docker pull ghcr.io/cuong78/livestream-frontend:main-abc1234

# Tag lại thành latest
docker tag ghcr.io/cuong78/livestream-backend:main-abc1234 ghcr.io/cuong78/livestream-backend:latest
docker tag ghcr.io/cuong78/livestream-frontend:main-abc1234 ghcr.io/cuong78/livestream-frontend:latest

# Restart
docker-compose -f docker-compose.cicd.yml up -d
```

---

**Chúc bạn deploy thành công! 🚀**
