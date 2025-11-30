# 🎥 Live Streaming Platform

Nền tảng live streaming cho phép admin phát trực tiếp từ điện thoại (RTMP) và khách hàng xem + bình luận real-time không cần đăng nhập.

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
- **Video Player**: Video.js (HLS support)
- **WebSocket**: STOMP.js + SockJS
- **HTTP Client**: Axios

#### Streaming Infrastructure

- **RTMP Server**: SRS (Simple Realtime Server) v5
- **Protocol**: RTMP input → HLS output
- **Quality**: Multi-bitrate (SD/HD/FHD)

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

### Database Schema

```sql
-- Users table (Admin accounts)
users
  - id (PK)
  - username (unique)
  - password (hashed)
  - email
  - stream_key (unique)
  - role (ADMIN/USER)
  - is_active
  - created_at
  - updated_at

-- Streams table (Live stream sessions)
streams
  - id (PK)
  - user_id (FK → users)
  - title
  - description
  - status (IDLE/LIVE/ENDED)
  - viewer_count
  - started_at
  - ended_at
  - hls_url
  - created_at
  - updated_at

-- Comments table (Chat messages)
comments
  - id (PK)
  - stream_id (FK → streams)
  - display_name
  - content
  - ip_address
  - is_deleted
  - created_at
```

---

## 📂 Cấu trúc dự án

```
liveStream/
├── livestream-backend/          # Spring Boot Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/livestream/
│   │   │   │   ├── LiveStreamApplication.java
│   │   │   │   ├── config/
│   │   │   │   │   ├── SecurityConfig.java
│   │   │   │   │   └── WebSocketConfig.java
│   │   │   │   ├── controller/
│   │   │   │   │   ├── ChatController.java
│   │   │   │   │   └── StreamController.java
│   │   │   │   ├── entity/
│   │   │   │   │   ├── User.java
│   │   │   │   │   ├── Stream.java
│   │   │   │   │   └── Comment.java
│   │   │   │   ├── repository/
│   │   │   │   │   ├── UserRepository.java
│   │   │   │   │   ├── StreamRepository.java
│   │   │   │   │   └── CommentRepository.java
│   │   │   │   └── dto/
│   │   │   │       ├── CommentDto.java
│   │   │   │       └── StreamDto.java
│   │   │   └── resources/
│   │   │       └── application.yml
│   │   └── test/
│   ├── pom.xml
│   ├── Dockerfile
│   └── .gitignore
│
├── livestream-frontend/         # React TypeScript Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── VideoPlayer.tsx
│   │   │   └── ChatBox.tsx
│   │   ├── pages/
│   │   │   ├── ViewerPage.tsx
│   │   │   ├── AdminLoginPage.tsx
│   │   │   └── AdminDashboardPage.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── websocket.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .gitignore
│
├── docker-compose.yml           # Docker orchestration
├── srs.conf                     # SRS server config
└── README.md                    # Documentation (this file)
```

---

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
git clone <repository-url>
cd liveStream
```

2. **Khởi động toàn bộ services**

```bash
docker-compose up -d
```

Services sẽ chạy tại:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api
- RTMP Server: rtmp://localhost:1935
- HLS Stream: http://localhost:8080/live/
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

   - iOS: "RTMP Live Streaming Publisher" (như trong hình đính kèm)
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

### Phase 3: RTMP & Streaming Infrastructure (Tiếp theo)

- [ ] Setup SRS server container
- [ ] Cấu hình RTMP input (port 1935)
- [ ] Cấu hình HLS output (transcoding)
- [ ] Multi-bitrate streaming (SD/HD/FHD)
- [ ] Stream key validation endpoint
- [ ] HTTP callbacks (on_publish, on_unpublish)
- [ ] HLS file serving through Nginx

### Phase 4: Authentication & Admin Features

- [ ] JWT token generation/validation service
- [ ] Login API endpoint
- [ ] Admin dashboard UI
  - [ ] Login form
  - [ ] Stream control panel (start/stop)
  - [ ] Stream key display
  - [ ] Real-time viewer count
  - [ ] Chat monitor
- [ ] Protected routes (frontend)
- [ ] Stream key generation for admin users

### Phase 5: Real-time Chat Enhancement

- [ ] Comment validation (length, profanity filter)
- [ ] Rate limiting (Redis-based)
- [ ] IP tracking
- [ ] Comment moderation APIs
  - [ ] Delete comment
  - [ ] Ban user by IP
- [ ] Load comment history on page load
- [ ] Pagination for old comments

### Phase 6: Stream Management

- [ ] Create stream API
- [ ] Update stream info (title, description)
- [ ] End stream API
- [ ] Stream status monitoring
- [ ] Viewer count tracking (Redis)
- [ ] Stream analytics
  - [ ] Total viewers
  - [ ] Peak viewers
  - [ ] Average watch time
  - [ ] Comment count

### Phase 7: Mobile Optimization

- [ ] Responsive CSS improvements
- [ ] Touch-friendly UI
- [ ] Mobile video controls
- [ ] Network quality detection
- [ ] Auto quality switching
- [ ] Offline notification
- [ ] PWA setup (optional)

### Phase 8: Testing & Quality Assurance

- [ ] Backend unit tests
- [ ] Integration tests (API)
- [ ] WebSocket connection tests
- [ ] Frontend component tests
- [ ] E2E tests (Playwright/Cypress)
- [ ] Load testing (stream + chat)
- [ ] Security audit

### Phase 9: Production Deployment

- [ ] Environment configuration (.env)
- [ ] Nginx SSL/TLS setup (Let's Encrypt)
- [ ] Domain configuration
- [ ] CDN integration (optional: CloudFlare)
- [ ] Backup strategy (database)
- [ ] Monitoring setup
  - [ ] Prometheus + Grafana
  - [ ] Application logs (ELK stack optional)
  - [ ] Alerting (email/Slack)
- [ ] CI/CD pipeline (GitHub Actions)

### Phase 10: Advanced Features (Optional)

- [ ] Multiple concurrent streams
- [ ] Stream recording (save to storage)
- [ ] VOD (Video on Demand) - replay past streams
- [ ] Emoji reactions
- [ ] Viewer authentication (optional)
- [ ] Donation/tip integration
- [ ] Stream scheduling
- [ ] Multi-language support

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
```

---

## 📊 API Documentation

### REST Endpoints

#### Stream APIs

```
GET  /api/stream/current          # Get current live stream
POST /api/stream/start            # Start stream (Admin only)
POST /api/stream/stop             # Stop stream (Admin only)
GET  /api/stream/status           # Get stream status
```

#### Auth APIs

```
POST /api/auth/login              # Admin login
POST /api/auth/logout             # Admin logout
GET  /api/auth/me                 # Get current user info
```

#### Admin APIs

```
GET  /api/admin/streams           # Get all streams history
GET  /api/admin/comments/:id      # Get comments for stream
DELETE /api/admin/comments/:id    # Delete comment
POST /api/admin/ban               # Ban user by IP
```

### WebSocket Endpoints

```
CONNECT: /ws/chat                 # Connect to WebSocket
SUBSCRIBE: /topic/live-comments   # Subscribe to comments
SEND: /app/comment                # Send new comment
```

**Message Format:**

```json
{
  "displayName": "Nguyen Van A",
  "content": "Hello world!"
}
```

---

## 🧪 Testing

### Backend Tests

```bash
cd livestream-backend
mvn test
```

### Frontend Tests

```bash
cd livestream-frontend
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

---

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

Các bước tiếp theo:

1. Chạy `docker-compose up -d` để test infrastructure
2. Implement authentication (Phase 4)
3. Setup SRS server và test RTMP streaming (Phase 3)
4. Deploy lên server production (Phase 9)
