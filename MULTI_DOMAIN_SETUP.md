# Hướng dẫn cấu hình Multi-Domain (utgachoi.com + utphuyen.com)

## 📋 Tổng quan

Hướng dẫn này giúp bạn cấu hình để cả hai domain `utgachoi.com` và `utphuyen.com` đều có thể:
- ✅ Xem video trực tiếp
- ✅ Bình luận real-time
- ✅ Sử dụng chung backend và frontend

## 🚀 Các bước thực hiện

### Bước 1: Chạy script cấu hình Nginx trên VPS

```bash
# SSH vào VPS
ssh root@72.61.119.173

# Upload script lên server (hoặc copy nội dung và tạo file)
# Sau đó chạy:
chmod +x setup-utphuyen-domain.sh
./setup-utphuyen-domain.sh
```

Script này sẽ:
- Tạo cấu hình Nginx cho `utphuyen.com`
- Cài đặt SSL certificate với Let's Encrypt
- Khởi động lại Nginx

### Bước 2: Cập nhật CORS trong file .env trên VPS

```bash
# SSH vào VPS
ssh root@72.61.119.173
cd /var/www/livestream

# Backup file .env hiện tại
cp .env .env.backup

# Cập nhật CORS_ALLOWED_ORIGINS để bao gồm cả 2 domain
# Tìm dòng:
# CORS_ALLOWED_ORIGINS=https://utgachoi.com

# Thay đổi thành:
# CORS_ALLOWED_ORIGINS=https://utgachoi.com,https://utphuyen.com
```

Hoặc chỉnh sửa trực tiếp:

```bash
nano .env
```

Tìm và cập nhật dòng:
```bash
CORS_ALLOWED_ORIGINS=https://utgachoi.com,https://utphuyen.com
```

### Bước 3: Khởi động lại backend để áp dụng CORS mới

```bash
cd /var/www/livestream
docker compose -f docker-compose.prod.yml restart backend
```

Hoặc nếu muốn rebuild:

```bash
cd /var/www/livestream
docker compose -f docker-compose.prod.yml pull backend
docker compose -f docker-compose.prod.yml up -d backend
```

### Bước 4: Kiểm tra hoạt động

1. **Kiểm tra domain mới:**
   ```bash
   curl -I https://utphuyen.com
   ```

2. **Kiểm tra SSL:**
   - Truy cập: https://utphuyen.com
   - Kiểm tra certificate có hợp lệ không

3. **Kiểm tra API:**
   ```bash
   curl https://utphuyen.com/api/stream/current
   ```

4. **Kiểm tra WebSocket:**
   - Mở https://utphuyen.com
   - Mở Developer Tools → Network → WS
   - Kiểm tra WebSocket connection có thành công không

## 🔧 Cấu hình chi tiết

### Nginx Configuration

Cả hai domain đều sử dụng cùng cấu hình:
- **Frontend**: Port 3000 (container livestream-frontend)
- **Backend API**: Port 8080 (container livestream-backend)
- **WebSocket**: Port 8080 (container livestream-backend)
- **HLS Streaming**: Port 8081 (container livestream-hls)
- **Videos**: Port 8081 (container livestream-hls)

### CORS Configuration

Backend đã được cấu hình để chấp nhận cả 2 domain thông qua biến môi trường `CORS_ALLOWED_ORIGINS`.

### Frontend Build

Frontend hiện tại được build với các biến môi trường cố định cho `utgachoi.com`. 
Tuy nhiên, vì cả 2 domain đều dùng chung frontend container, nên:
- API calls sẽ tự động dùng domain hiện tại (relative paths)
- WebSocket sẽ tự động dùng domain hiện tại (relative paths)
- HLS URLs sẽ được backend trả về động

## ⚠️ Lưu ý quan trọng

1. **DNS đã được trỏ**: Đảm bảo DNS của `utphuyen.com` đã trỏ về IP `72.61.119.173`

2. **SSL Certificate**: Let's Encrypt sẽ tự động gia hạn mỗi 90 ngày

3. **CORS**: Nếu gặp lỗi CORS, kiểm tra lại:
   - File `.env` trên VPS
   - Backend container đã restart chưa
   - Domain có đúng format không (có https://)

4. **WebSocket**: Cả 2 domain đều dùng chung WebSocket endpoint, nên chat sẽ được chia sẻ giữa 2 domain

5. **Video Streaming**: Cả 2 domain đều xem cùng một stream (nếu đang live)

## 🐛 Troubleshooting

### Lỗi: "502 Bad Gateway"
```bash
# Kiểm tra containers đang chạy
docker ps

# Kiểm tra logs
docker logs livestream-frontend
docker logs livestream-backend
```

### Lỗi: "CORS policy blocked"
```bash
# Kiểm tra CORS_ALLOWED_ORIGINS trong .env
cat /var/www/livestream/.env | grep CORS

# Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

### Lỗi: "SSL certificate invalid"
```bash
# Kiểm tra certificate
certbot certificates

# Renew certificate nếu cần
certbot renew --dry-run
```

## 📝 Kiểm tra sau khi setup

- [ ] https://utphuyen.com có thể truy cập
- [ ] https://utphuyen.com/api/stream/current trả về dữ liệu
- [ ] WebSocket connection thành công
- [ ] Chat hoạt động bình thường
- [ ] Video streaming hoạt động (nếu đang live)
- [ ] Không có lỗi CORS trong browser console

## 🎉 Hoàn thành!

Sau khi hoàn thành các bước trên, cả hai domain sẽ hoạt động độc lập nhưng chia sẻ cùng:
- Backend API
- Database
- Redis cache
- Video streaming server
- Chat real-time (cùng một chat room)
