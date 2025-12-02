# 📊 SO SÁNH CẤU HÌNH TRƯỚC VÀ SAU KHI FIX

## 🔴 **VẤN ĐỀ 1: Frontend Dockerfile - Build Args**

### ❌ **TRƯỚC (Sai):**
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
```

**Vấn đề:** 
- Không nhận `build-args` từ GitHub Actions
- Các biến `VITE_API_URL`, `VITE_WS_URL`, `VITE_HLS_BASE_URL` không được inject
- Frontend build với config local → API calls fail trên production

### ✅ **SAU (Đúng):**
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app

# ✨ Accept build arguments
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_HLS_BASE_URL

# ✨ Set environment variables for Vite build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
ENV VITE_HLS_BASE_URL=${VITE_HLS_BASE_URL}

COPY package*.json ./
RUN npm install
COPY . .

# ✨ Create .env file for Vite
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env && \
    echo "VITE_WS_URL=${VITE_WS_URL}" >> .env && \
    echo "VITE_HLS_BASE_URL=${VITE_HLS_BASE_URL}" >> .env

RUN npm run build
```

**Lợi ích:**
- ✅ Nhận được `build-args` từ GitHub Actions
- ✅ Tạo `.env` file trước khi build → Vite inject vào code
- ✅ Frontend build với config production → API calls thành công

---

## 🔴 **VẤN ĐỀ 2: Nginx CORS Headers**

### ❌ **TRƯỚC (Sai):**
```nginx
location /hls/ {
    # CORS for HLS
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Range,DNT,X-CustomHeader,..." always;
}
```

**Vấn đề:**
- Thiếu `Access-Control-Expose-Headers` → Browser không đọc được `Content-Range`
- Video.js cần `Range` requests để seek video → CORS block
- Thiếu `HEAD` method → Preflight OPTIONS fail

### ✅ **SAU (Đúng):**
```nginx
location /hls/ {
    # Handle OPTIONS requests for CORS preflight
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, HEAD, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Range,If-Range,Accept-Ranges,...' always;
        add_header 'Access-Control-Max-Age' 1728000;
        return 204;
    }

    # ✨ CORS headers for HLS streaming
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Range,If-Range,Accept-Ranges,Content-Type,Content-Length,..." always;
    add_header Access-Control-Expose-Headers "Content-Length,Content-Range,Accept-Ranges" always;
}
```

**Lợi ích:**
- ✅ Browser có thể đọc `Content-Range` header
- ✅ Video.js có thể seek video (byte-range requests)
- ✅ Preflight OPTIONS request thành công

---

## 🔴 **VẤN ĐỀ 3: Backend HLS URL Configuration**

### ❌ **TRƯỚC (Sai):**
```yaml
# application-prod.yml
stream:
  hls:
    base-url: ${STREAM_HLS_BASE_URL:http://localhost:8081}
```

**Backend tạo HLS URL:**
```java
String hlsUrl = String.format("%s/%s/%s.m3u8", hlsBaseUrl, app, stream);
// Kết quả: http://localhost:8081/live/stream.m3u8 ❌
```

**Vấn đề:**
- Frontend không thể truy cập `localhost:8081` từ browser
- CORS error vì khác origin
- 404 error vì domain sai

### ✅ **SAU (Đúng):**
```yaml
# application-prod.yml
stream:
  hls:
    base-url: ${STREAM_HLS_BASE_URL:https://anhcuong.space/hls}
```

**Backend tạo HLS URL:**
```java
String hlsUrl = String.format("%s/%s/%s.m3u8", hlsBaseUrl, app, stream);
// Kết quả: https://anhcuong.space/hls/live/stream.m3u8 ✅
```

**Lợi ích:**
- ✅ Frontend truy cập được HLS URL
- ✅ Cùng origin → Không CORS error
- ✅ Nginx proxy đúng → 200 OK

---

## 🔴 **VẤN ĐỀ 4: Environment Variables**

### ❌ **TRƯỚC (Thiếu):**
```bash
# .env trên VPS
DB_NAME=livestream_db
DB_USERNAME=livestream_user
DB_PASSWORD=xxx
CORS_ORIGINS=https://anhcuong.space
DOMAIN=anhcuong.space
# ❌ Thiếu STREAM_HLS_BASE_URL
```

**Backend sử dụng default:**
```yaml
hls:
  base-url: ${STREAM_HLS_BASE_URL:http://localhost:8081}
               # ↑ Sử dụng default vì env var không có
```

### ✅ **SAU (Đầy đủ):**
```bash
# .env trên VPS
DB_NAME=livestream_db
DB_USERNAME=livestream_user
DB_PASSWORD=xxx
CORS_ORIGINS=https://anhcuong.space,https://www.anhcuong.space
DOMAIN=anhcuong.space

# ✨ Thêm streaming configuration
STREAM_RTMP_URL=rtmp://srs:1935/live
STREAM_HLS_BASE_URL=https://anhcuong.space/hls
```

**Backend sử dụng env var:**
```yaml
hls:
  base-url: ${STREAM_HLS_BASE_URL:http://localhost:8081}
               # ↑ Sử dụng https://anhcuong.space/hls từ env
```

**Lợi ích:**
- ✅ Backend biết domain thực
- ✅ HLS URL tạo đúng
- ✅ Không hardcode domain trong code

---

## 🔴 **VẤN ĐỀ 5: SRS Configuration**

### ℹ️ **SRS Config (Không cần sửa):**
```conf
vhost __defaultVhost__ {
    hls {
        enabled         on;
        hls_path        ./objs/nginx/html;
        hls_fragment    1;
        hls_window      6;
        hls_m3u8_file   [app]/[stream].m3u8;
        hls_ts_file     [app]/[stream]-[seq].ts;
    }
}
```

**SRS tạo files:**
```
/usr/local/srs/objs/nginx/html/
  ├── live/
  │   ├── stream.m3u8
  │   ├── stream-0.ts
  │   ├── stream-1.ts
  │   └── ...
```

**Nginx proxy:**
```nginx
location /hls/ {
    proxy_pass http://srs_hls/;
    # Khi request: https://anhcuong.space/hls/live/stream.m3u8
    # Nginx proxy: http://srs:8080/live/stream.m3u8 ✅
}
```

**Lưu ý:**
- SRS serve static files qua built-in HTTP server (port 8080)
- Nginx chỉ cần proxy pass → không cần sửa SRS config
- Path mapping: `/hls/` → `http://srs:8080/` → files trong `./objs/nginx/html/`

---

## 📊 **FLOW HOẠT ĐỘNG**

### ❌ **TRƯỚC (Lỗi):**

```
1. Client request stream
   ↓
2. Backend API: GET /api/stream/current
   ↓
3. Backend trả về: {
      hlsUrl: "http://localhost:8081/live/stream.m3u8"  ❌
   }
   ↓
4. Frontend VideoPlayer cố load:
   http://localhost:8081/live/stream.m3u8
   ↓
5. Browser error: ERR_CONNECTION_REFUSED  ❌
```

### ✅ **SAU (Đúng):**

```
1. Client request stream
   ↓
2. Backend API: GET /api/stream/current
   ↓
3. Backend đọc env: STREAM_HLS_BASE_URL=https://anhcuong.space/hls
   ↓
4. Backend trả về: {
      hlsUrl: "https://anhcuong.space/hls/live/stream.m3u8"  ✅
   }
   ↓
5. Frontend VideoPlayer load:
   https://anhcuong.space/hls/live/stream.m3u8
   ↓
6. Nginx nhận request: /hls/live/stream.m3u8
   ↓
7. Nginx proxy pass: http://srs:8080/live/stream.m3u8
   ↓
8. SRS trả file từ: ./objs/nginx/html/live/stream.m3u8
   ↓
9. Nginx trả về client với CORS headers
   ↓
10. Video.js parse m3u8 và request .ts files
   ↓
11. Video play successfully  ✅
```

---

## 🔧 **GITHUB ACTIONS WORKFLOW**

### ℹ️ **Build Args (Không cần sửa - đã đúng):**

```yaml
- name: Build and push frontend image
  uses: docker/build-push-action@v5
  with:
    context: ./livestream-frontend
    file: ./livestream-frontend/Dockerfile
    push: true
    tags: ${{ steps.meta-frontend.outputs.tags }}
    build-args: |
      VITE_API_URL=${{ secrets.VITE_API_URL }}
      VITE_WS_URL=${{ secrets.VITE_WS_URL }}
      VITE_HLS_BASE_URL=${{ secrets.VITE_HLS_BASE_URL }}
```

**Giải thích:**
- GitHub Actions pass `build-args` vào Docker build
- Dockerfile nhận qua `ARG` directive
- Set thành `ENV` để Vite đọc được
- Tạo `.env` file để chắc chắn

**GitHub Secrets cần có:**
```
VITE_API_URL=https://anhcuong.space/api
VITE_WS_URL=wss://anhcuong.space/api/ws
VITE_HLS_BASE_URL=https://anhcuong.space/hls  ✅
```

---

## 📝 **CHECKLIST KIỂM TRA**

### **Frontend:**
- [ ] `Dockerfile` có `ARG VITE_API_URL` / `VITE_WS_URL` / `VITE_HLS_BASE_URL`
- [ ] `Dockerfile` có `ENV` để set environment variables
- [ ] `Dockerfile` tạo `.env` file trước khi build
- [ ] GitHub Actions có `build-args` trong workflow
- [ ] GitHub Secrets đã set đủ 3 biến `VITE_*`

### **Backend:**
- [ ] `application-prod.yml` có `stream.hls.base-url: ${STREAM_HLS_BASE_URL:...}`
- [ ] Default value trong `application-prod.yml` là domain thực (không phải localhost)
- [ ] `.env` trên VPS có `STREAM_HLS_BASE_URL=https://anhcuong.space/hls`
- [ ] Backend logs hiển thị HLS URL đúng

### **Nginx:**
- [ ] `nginx-prod.conf` có `Access-Control-Expose-Headers`
- [ ] CORS headers bao gồm `Range`, `If-Range`, `Accept-Ranges`
- [ ] OPTIONS method được handle riêng
- [ ] `proxy_pass http://srs_hls/;` (có trailing slash)

### **SRS:**
- [ ] `srs.conf` có `hls.enabled = on`
- [ ] `hls_path = ./objs/nginx/html`
- [ ] `hls_m3u8_file = [app]/[stream].m3u8`
- [ ] Container running và listen port 8080

### **VPS Environment:**
- [ ] `/opt/livestream-cicd/.env` tồn tại
- [ ] Biến `STREAM_HLS_BASE_URL` có trong `.env`
- [ ] Domain đúng (không phải localhost)
- [ ] SSL certificate còn hạn

---

## 🎯 **TEST CASES**

### **Test 1: Backend tạo HLS URL đúng**
```bash
# Start stream và check logs
docker logs livestream-backend | grep hlsUrl

# Mong đợi:
# hlsUrl=https://anhcuong.space/hls/live/stream.m3u8 ✅

# Không được thấy:
# hlsUrl=http://localhost:8081/live/stream.m3u8 ❌
```

### **Test 2: Frontend request API thành công**
```javascript
// Browser console (F12)
fetch('/api/stream/current')
  .then(r => r.json())
  .then(data => console.log(data.hlsUrl))

// Mong đợi:
// https://anhcuong.space/hls/live/stream.m3u8 ✅
```

### **Test 3: HLS m3u8 accessible**
```bash
curl https://anhcuong.space/hls/live/stream.m3u8

# Mong đợi: 200 OK và nội dung m3u8
#EXTM3U
#EXT-X-VERSION:3
...
```

### **Test 4: CORS headers có đủ**
```bash
curl -I https://anhcuong.space/hls/live/stream.m3u8

# Mong đợi headers:
access-control-allow-origin: *
access-control-expose-headers: Content-Length,Content-Range,Accept-Ranges
```

### **Test 5: Video.js load thành công**
```javascript
// Browser console (F12) trên trang livestream
// Không có error:
// ❌ net::ERR_NAME_NOT_RESOLVED
// ❌ CORS policy blocked
// ❌ 404 Not Found

// Có log:
// ✅ Video metadata loaded
// ✅ Playing...
```

---

## 🚀 **DEPLOYMENT STEPS SUMMARY**

### **1. Local → GitHub:**
```bash
git add .
git commit -m "fix: streaming configuration"
git push origin main
```

### **2. GitHub Actions:**
- ✅ Build backend với Spring Boot prod profile
- ✅ Build frontend với `VITE_*` build-args
- ✅ Push images lên GHCR
- ✅ SSH vào VPS và deploy

### **3. VPS:**
- ✅ Pull images mới
- ✅ Đọc `.env` file với `STREAM_HLS_BASE_URL`
- ✅ Start containers
- ✅ Nginx proxy HLS với CORS headers đầy đủ

### **4. Runtime:**
- ✅ Client request stream info
- ✅ Backend trả HLS URL với domain thực
- ✅ Frontend VideoPlayer load HLS
- ✅ Nginx proxy với CORS headers
- ✅ SRS serve HLS files
- ✅ Video play successfully

---

**Tổng kết:** 5 vấn đề đã được fix → Streaming hoạt động bình thường! 🎉
