# 🎥 CLB Gà Chọi Cao Đổi - Live Streaming Platform

Nền tảng live streaming chuyên nghiệp, phát trực tiếp từ điện thoại (RTMP) với chat real-time.

---

## 🚨 **STREAMING FIX - DECEMBER 2024**

**⚠️ NẾU GẶP VẤN ĐỀ VỀ LIVESTREAM KHÔNG HOẠT ĐỘNG:**

📚 **ĐỌC CÁC FILE HƯỚNG DẪN:**
1. **[STREAMING_FIX_GUIDE.md](./STREAMING_FIX_GUIDE.md)** ⭐ - Hướng dẫn fix chi tiết
2. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Commands và troubleshooting
3. **[BEFORE_AFTER_COMPARISON.md](./BEFORE_AFTER_COMPARISON.md)** - So sánh config
4. **[CHANGELOG.md](./CHANGELOG.md)** - Lịch sử thay đổi

🔧 **Các lỗi đã fix:**
- ✅ Frontend build args (VITE_*) không được inject
- ✅ CORS headers thiếu cho HLS streaming  
- ✅ Backend trả HLS URL với `localhost` thay vì domain
- ✅ Environment variables thiếu `STREAM_HLS_BASE_URL`

📦 **Files mới:**
- `reset-server.sh` - Script khôi phục server
- `STREAMING_FIX_GUIDE.md` - Hướng dẫn deployment
- `QUICK_REFERENCE.md` - Quick commands
- `BEFORE_AFTER_COMPARISON.md` - So sánh config

---

## 🎨 Thiết kế mới

- 🎨 Giao diện chuyên nghiệp với màu đỏ/vàng/đen truyền thống
- 📱 Responsive hoàn toàn cho mobile và desktop
- ✨ Hiệu ứng gradient, animation mượt mà
- 🎯 Tích hợp đầy đủ thông tin CLB, liên hệ, quy định

## 📋 Tổng quan dự án

### Mô tả

- **Admin**: Đăng nhập, phát live từ điện thoại qua RTMP Publisher app, quản lý stream, xem chat real-time
- **Khách**: Xem live không cần đăng nhập, bình luận với tên tùy chỉnh (lưu vào localStorage)
- **Real-time chat**: WebSocket cho bình luận trực tiếp
- **Mobile-first**: Tối ưu cho điện thoại (admin và viewer đều dùng mobile nhiều)

### Tech Stack

#### Backend

- **Framework**: Spring Boot 3.2.0
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **WebSocket**: STOMP protocol
- **Security**: Spring Security + JWT
- **Build**: Maven

#### Frontend

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Router**: React Router v6
- **Video Player**: Video.js (HLS support) - **Custom Theme**
- **WebSocket**: STOMP.js + SockJS
- **HTTP Client**: Axios
- **Styling**: Custom CSS with responsive design

#### Streaming Infrastructure

- **RTMP Server**: SRS (Simple Realtime Server) v5
- **Protocol**: RTMP input → HLS output
- **Latency**: ~5-8 seconds (optimized)

#### DevOps

- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (reverse proxy)

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐
│  Mobile Phone   │
│  (RTMP Publisher│  ──RTMP (1935)──▶  ┌──────────────┐
│   App - Admin)  │                     │  SRS Server  │
└─────────────────┘                     │  (RTMP→HLS)  │
                                        └──────┬───────┘
┌─────────────────┐                           │ HLS
│  Mobile/Web     │                           ▼
│  (Viewer)       │  ◀─────────────  ┌──────────────┐
└────────┬────────┘                  │   Nginx      │
         │                           │ (Reverse Proxy)
         │ HTTP/WS                   └──────┬───────┘
         ▼                                  │
┌─────────────────────────────────────────▼┴────────┐
│              Spring Boot Backend                   │
│  - REST API                                        │
│  - WebSocket (STOMP)                               │
│  - JWT Auth                                        │
└────────┬──────────────────────┬────────────────────┘
         │                      │
         ▼                      ▼
┌──────────────┐        ┌──────────────┐
│  PostgreSQL  │        │    Redis     │
│  (Data)      │        │  (Cache)     │
└──────────────┘        └──────────────┘
```

🚀 Kiến trúc của Chat System

┌─────────────┐ WebSocket STOMP ┌─────────────┐
│ Client A │ ─────────────────────────────▶ │ Backend │
│ (Browser) │ │ ChatController │
└─────────────┘ └──────┬──────┘
│
│ Validate
┌─────────────┐ │ + Rate Limit
│ Client B │ ◀────────── Broadcast ───────────────── │ (Redis)
│ (Browser) │ /topic/live-comments │
└─────────────┘ ▼
│ ┌─────────────┐
│ Circular Buffer │ Redis │
│ (50 comments) │ rate_limit: │
▼ │ comment:IP │
┌─────────────┐ └─────────────┘
│ localStorage│
│ displayName │
└─────────────┘

## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống

- **Docker** & **Docker Compose** (recommended)
- Hoặc cài riêng:
  - Java 17+
  - Node.js 18+
  - PostgreSQL 15+
  - Redis 7+
  - Maven 3.9+

### Cài đặt với Docker (Khuyến nghị)

1. **Clone repository**

```bash
git clone https://github.com/cuong78/livestream.git
cd liveStream
```

2. **Khởi động toàn bộ services**

```bash
docker-compose up -d
```

Services sẽ chạy tại:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/api/swagger-ui.html
- RTMP Server: rtmp://localhost:1935/live
- HLS Stream: http://localhost:8081/live/{streamKey}.m3u8
- SRS HTTP API: http://localhost:1985/api/v1
- PostgreSQL: localhost:5432
- Redis: localhost:6379

3. **Kiểm tra logs**

```bash
docker-compose logs -f
```

4. **Dừng services**

```bash
docker-compose down
```

### Cài đặt thủ công (Development)

#### Backend

```bash
cd livestream-backend

# Install dependencies
mvn clean install

# Run application
mvn spring-boot:run
```

#### Frontend

```bash
cd livestream-frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

#### Database Setup

```sql
-- Create database
CREATE DATABASE livestream_db;

-- Create user
CREATE USER livestream_user WITH PASSWORD 'livestream_pass';
GRANT ALL PRIVILEGES ON DATABASE livestream_db TO livestream_user;
```

---

## 📱 Hướng dẫn sử dụng

### Cho Admin

1. **Cài đặt RTMP Publisher app** trên điện thoại

   - iOS: "RTMP Live Streaming Publisher"
   - Android: "Larix Broadcaster" hoặc "CameraFi Live"

2. **Cấu hình streaming**

   - **Server URL**: `rtmp://your-server.com:1935/live`
   - **Stream Key**: (lấy từ admin dashboard sau khi đăng nhập)
   - **Quality**: HD (720p, 3500kbps)
   - **Frame Rate**: 25-30 FPS
   - **Orientation**: Landscape (16:9)

3. **Bắt đầu live**
   - Đăng nhập admin dashboard
   - Copy stream key
   - Mở RTMP Publisher app → Settings → paste Server URL và Stream Key
   - Nhấn "Start Streaming"
   - Chat sẽ hiển thị bên cạnh/dưới video

### Cho Viewer (Khách hàng)

1. **Truy cập website** (không cần đăng nhập)

   - Desktop: http://your-domain.com
   - Mobile: Tương tự, tối ưu responsive

2. **Xem live và bình luận**
   - Nhập tên hiển thị (lưu tự động vào localStorage)
   - Nhập nội dung bình luận
   - Nhấn "Gửi"
   - Bình luận hiển thị real-time cho tất cả viewers

---

## 🛠️ Kế hoạch phát triển chi tiết

### Phase 1: Backend Foundation ✅ (Đã hoàn thành)

- [x] Setup Spring Boot project với Maven
- [x] Cấu hình PostgreSQL + Redis connection
- [x] Tạo entities (User, Stream, Comment)
- [x] Tạo repositories (JPA)
- [x] Config WebSocket (STOMP)
- [x] Config Spring Security (JWT ready)
- [x] Controller cơ bản (Stream, Chat)

### Phase 2: Frontend Foundation ✅ (Đã hoàn thành)

- [x] Setup React + TypeScript + Vite
- [x] Component VideoPlayer (Video.js + HLS)
- [x] Component ChatBox (localStorage cho display name)
- [x] Page ViewerPage (layout responsive)
- [x] WebSocket client (STOMP.js)
- [x] Routing (React Router)

### Phase 3: RTMP & Streaming Infrastructure ✅ (Đã hoàn thành)

- [x] Setup SRS server container (Docker)
- [x] Cấu hình RTMP input (port 1935)
- [x] Cấu hình HLS output (low-latency: 1s segments)
- [x] Stream key validation endpoint
- [x] HTTP callbacks (on_publish, on_unpublish)
- [x] HLS file serving (port 8081)
- [x] CORS enabled cho streaming
- [x] Tối ưu low-latency (~5-8s delay)

### Phase 4: Authentication & Admin Features ✅ (Đã hoàn thành)

- [x] JWT token generation/validation service (JwtService)
- [x] Login API endpoint (POST /auth/login)
- [x] Register API endpoint (POST /auth/register)
- [x] JWT Authentication Filter
- [x] Stream settings API (GET /user/stream-settings)
- [x] Regenerate stream key API
- [x] Protected routes với Spring Security
- [x] Stream key tự động generate cho user
- [x] Swagger UI với JWT authentication

### Phase 5: Real-time Chat Enhancement ✅ (Hoàn thành)

- [x] WebSocket STOMP configuration
- [x] ChatBox component (React)
- [x] Real-time comment display
- [x] Comment validation (length 1-500 chars, profanity filter)
- [x] Rate limiting (3 giây/comment per IP với Redis)
- [x] IP tracking qua WebSocket handshake interceptor
- [x] Profanity filter tiếng Việt + English
- [x] Block số điện thoại, URLs, từ ngữ cấm (cá độ, chửi thề)
- [x] Frontend circular buffer: chỉ giữ 50 comments mới nhất
- [x] Error handling và UI feedback real-time
- [x] No database storage (chỉ broadcast qua WebSocket)
- [x] Delete comment

### Phase 6: Stream Management ⏳ (Đang phát triển)

- [x] Create stream API (tự động qua SRS callback)
- [x] End stream API (tự động qua SRS callback)
- [x] Get current stream API (GET /stream/current)
- [x] Stream status monitoring (LIVE/ENDED)
- [x] SRS callbacks integration (on_publish, on_unpublish)
- [x] Auto stream creation khi user bắt đầu RTMP
- [x] Viewer count

### Phase 7: IP Blocking & Admin Features ✅ (Hoàn thành)

- [x] IP tracking trong WebSocket handshake
- [x] BlockedIp entity, repository, service
- [x] Admin block/unblock IP endpoints
- [x] BlockedIpsModal UI component
- [x] Admin context menu (delete comment, view IP, block IP)
- [x] Viewer count display and synchronization
- [x] Comment history với Redis (50 comments, 24h TTL)

### Phase 8: Testing & Quality Assurance ✅ (Hoàn thành)

**Load Testing (k6):**

- [x] Chat load test (100+ concurrent users, WebSocket)
- [x] Viewer load test (500-1000 concurrent viewers, HLS streaming)
- [x] API stress test (authentication, stream endpoints)
- [x] Performance benchmarks và thresholds
- [x] Custom metrics tracking (success rate, response time, errors)

**Security Audit:**

- [x] SQL injection testing (authentication, streams, admin)
- [x] XSS testing (comments, display names, stored XSS)
- [x] CSRF protection verification
- [x] Authentication & authorization tests (JWT, role-based)
- [x] Rate limiting verification
- [x] Input validation tests
- [x] WebSocket security (IP blocking, message validation)
- [x] Information disclosure checks
- [x] Security checklist documentation
- [x] Automated security test script (Python)
- [x] OWASP dependency check setup

**Documentation:**

- [x] Load testing guide (`tests/README.md`)
- [x] Security checklist (`tests/security/SECURITY_CHECKLIST.md`)
- [x] Test execution instructions
- [x] Performance benchmarks
- [x] Troubleshooting guide

**Location:** `tests/` directory

- `tests/load/` - k6 load testing scripts
- `tests/security/` - Security audit tools and checklist

### Phase 9: Production Deployment

- [ ] Environment configuration (.env)
- [ ] Nginx SSL/TLS setup (Let's Encrypt)
- [ ] Domain configuration
- [ ] CDN integration (CloudFlare)
- [ ] Backup strategy (database)
- [ ] Monitoring setup
  - [ ] Prometheus + Grafana
  - [ ] Application logs (ELK stack optional)
  - [ ] Alerting (email/Slack)
- [ ] CI/CD pipeline (GitHub Actions)

### Phase 10: Advanced Features (Optional)

- [ ] Stream recording (save to storage)
- [ ] VOD (Video on Demand) - replay past streams
- [ ] Emoji reactions

---

## 🔧 Cấu hình nâng cao

### Environment Variables

**Backend (.env hoặc application.yml)**

```yaml
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/livestream_db
SPRING_DATASOURCE_USERNAME=livestream_user
SPRING_DATASOURCE_PASSWORD=change-this-password
SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379
JWT_SECRET=change-this-secret-minimum-256-bits
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

**Frontend (.env)**

```env
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com/ws/chat
VITE_HLS_BASE_URL=https://stream.yourdomain.com/live
```

### Production Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /ws {
        proxy_pass http://backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # HLS Streaming
    location /live {
        proxy_pass http://srs:8080;
        add_header Cache-Control no-cache;
        add_header Access-Control-Allow-Origin *;
    }
}



### 2. Đăng ký user qua Swagger UI

1. Mở trình duyệt: http://localhost:8080/api/swagger-ui.html
2. Tìm endpoint `POST /auth/register`
3. Click "Try it out" và điền:
```

username: cuong
password: cuong123
email: cuong@test.com

````
4. Click "Execute"
5. Copy `streamKey` từ response

### 3. Login và lấy JWT token

1. Tìm endpoint `POST /auth/login`
2. Điền username và password
3. Copy `token` từ response
4. Click nút **"Authorize"** ở đầu trang Swagger
5. Nhập: `Bearer {token}` (thay {token} bằng token vừa copy)
6. Click "Authorize"

### 4. Test streaming từ điện thoại

1. Cài app **Larix Broadcaster** (Android) hoặc **RTMP Camera** (iOS)
2. Vào Settings:
- **Server URL**: `rtmp://IP4:1935/live` ( điện thoại và laptop phải dùng chung 1 mạng , để lấy IP4 lan adress , cmd ->  ipconfig)
- **Stream Key**: paste stream key từ bước 2
3. Nhấn "Start Streaming"

### 5. Xem live stream

**Cách 1: Trên máy tính (trình duyệt)**

- Mở: http://localhost:3000

**Cách 2: Xem trực tiếp HLS**

- URL: `http://domain(IP4localhost):8081/live/{streamKey}.m3u8`
- Dùng VLC Player: Media → Open Network Stream → paste URL

### 6. Kiểm tra logs

```bash
# Backend logs
docker logs livestream-backend -f

# SRS logs (xem RTMP connections)
docker logs livestream-srs -f

# All services
docker-compose logs -f
````

## 🎯 Tình trạng dự án hiện tại

**Dự án đã sẵn sàng để streaming! 🎊**

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 📞 Support

For issues and questions:

- Create an issue in GitHub repository
  👤 **Email:** cuongcaoleanh@gmail.com
- 👤 **Facebook:** [Anh Cương](https://www.facebook.com/ang.cuong.77)

---

## 🎯 Khuyến nghị tối ưu

### Performance

1. **CDN**: Sử dụng CloudFlare hoặc AWS CloudFront cho HLS files
2. **Redis**: Cache viewer count, stream status
3. **Database Indexing**: Index trên `stream_id`, `created_at` cho comments
4. **Connection Pooling**: HikariCP cho PostgreSQL (đã config sẵn)

### Security

1. **Rate Limiting**: Giới hạn comment frequency (1 comment/second/user)
2. **Input Validation**: Sanitize HTML trong comments
3. **HTTPS Only**: Bắt buộc SSL trong production
4. **CORS**: Chỉ allow domain cụ thể
5. **JWT Expiration**: Token expire sau 24h

### Scalability

1. **Horizontal Scaling**: Load balance multiple backend instances
2. **Redis Pub/Sub**: Để sync chat giữa multiple instances
3. **Database Replication**: Master-slave setup cho read-heavy workload
4. **Stream Server Clustering**: Multiple SRS instances + load balancer

### Monitoring

1. **Health Checks**: `/actuator/health` endpoint
2. **Metrics**: Prometheus metrics export
3. **Logging**: Structured logging (JSON format)
4. **Alerting**: Setup alerts cho downtime, high latency

---

**Dự án đã sẵn sàng để phát triển! 🚀**
