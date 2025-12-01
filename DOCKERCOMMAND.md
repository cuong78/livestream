# 🐳 Docker Commands - Hướng dẫn chi tiết

## 📋 Mục lục

1. Docker Compose Commands
2. Docker Container Commands
3. Docker Image Commands
4. Docker Network Commands
5. Docker Volume Commands
6. Docker System Commands

---

## 🎯 Docker Compose Commands

### 1. **Khởi động tất cả services**

```bash
docker-compose up
```

- Khởi động tất cả containers được định nghĩa trong `docker-compose.yml`
- Hiển thị logs trực tiếp trên terminal
- **Dùng khi:** Development, muốn xem logs real-time

```bash
docker-compose up -d
```

- `-d` (detached mode): Chạy containers ở background
- Không hiển thị logs, terminal được giải phóng
- **Dùng khi:** Production, chạy lâu dài

### 2. **Rebuild containers**

```bash
docker-compose up --build
```

- Rebuild images trước khi khởi động
- **Dùng khi:** Code đã thay đổi, cần build lại

```bash
docker-compose up -d --build --force-recreate
```

- `--build`: Rebuild images
- `--force-recreate`: Xóa containers cũ và tạo mới
- **Dùng khi:** Code thay đổi nhiều, cần refresh hoàn toàn

```bash
docker-compose build --no-cache
```

- `--no-cache`: Không dùng cache, build từ đầu
- **Dùng khi:** Dependencies thay đổi (package.json, pom.xml)

### 3. **Dừng containers**

```bash
docker-compose stop
```

- Dừng containers nhưng **không xóa**
- Có thể khởi động lại với `docker-compose start`

```bash
docker-compose down
```

- Dừng **VÀ xóa** containers, networks
- **KHÔNG** xóa volumes (data giữ nguyên)
- **Dùng khi:** Cần cleanup, restart clean

```bash
docker-compose down -v
```

- `-v`: Xóa cả volumes (⚠️ **Mất data trong database!**)
- **Dùng khi:** Reset database hoàn toàn

### 4. **Xem logs**

```bash
docker-compose logs
```

- Xem logs của tất cả services

```bash
docker-compose logs -f
```

- `-f` (follow): Theo dõi logs real-time
- Tương tự `tail -f` trên Linux

```bash
docker-compose logs -f backend
```

- Xem logs của service cụ thể (backend)

```bash
docker-compose logs --tail=100 backend
```

- `--tail=100`: Chỉ hiển thị 100 dòng cuối

### 5. **Quản lý từng service**

```bash
docker-compose restart backend
```

- Restart service backend

```bash
docker-compose up -d --no-deps --build backend
```

- `--no-deps`: Chỉ rebuild backend, không rebuild dependencies
- **Dùng khi:** Chỉ sửa code backend

```bash
docker-compose exec backend bash
```

- Vào trong container backend (chạy bash shell)
- **Dùng khi:** Debug, kiểm tra files bên trong container

### 6. **Xem trạng thái**

```bash
docker-compose ps
```

- Liệt kê tất cả containers và trạng thái
- Hiển thị: Name, Command, State, Ports

```bash
docker-compose top
```

- Xem processes đang chạy trong containers

---

## 🔧 Docker Container Commands

### 1. **Liệt kê containers**

```bash
docker ps
```

- Liệt kê containers **đang chạy**

```bash
docker ps -a
```

- `-a` (all): Liệt kê **tất cả** containers (kể cả đã dừng)

```bash
docker ps --filter "status=running"
```

- Lọc theo trạng thái

### 2. **Khởi động/Dừng containers**

```bash
docker start <container_id>
```

- Khởi động container đã dừng

```bash
docker stop <container_id>
```

- Dừng container (graceful shutdown, 10s timeout)

```bash
docker restart <container_id>
```

- Restart container

```bash
docker kill <container_id>
```

- Dừng ngay lập tức (force kill, không đợi cleanup)

### 3. **Xem logs containers**

```bash
docker logs <container_id>
```

- Xem logs

```bash
docker logs -f livestream-backend
```

- Follow logs real-time

```bash
docker logs --tail 50 livestream-backend
```

- Chỉ hiển thị 50 dòng cuối

```bash
docker logs --since 30m livestream-backend
```

- Logs trong 30 phút gần nhất

### 4. **Truy cập vào container**

```bash
docker exec -it <container_id> bash
```

- Vào container với bash shell
- `-i` (interactive): Giữ stdin mở
- `-t` (tty): Allocate terminal

```bash
docker exec -it livestream-postgres psql -U livestream_user -d livestream_db
```

- Kết nối trực tiếp vào PostgreSQL

```bash
docker exec -it livestream-redis redis-cli
```

- Kết nối vào Redis CLI

### 5. **Copy files**

```bash
docker cp myfile.txt <container_id>:/app/
```

- Copy file từ host vào container

```bash
docker cp <container_id>:/app/logs.txt ./logs.txt
```

- Copy file từ container ra host

### 6. **Xóa containers**

```bash
docker rm <container_id>
```

- Xóa container đã dừng

```bash
docker rm -f <container_id>
```

- `-f` (force): Xóa ngay cả khi đang chạy

```bash
docker container prune
```

- Xóa **tất cả** containers đã dừng

---

## 🖼️ Docker Image Commands

### 1. **Liệt kê images**

```bash
docker images
```

- Liệt kê tất cả images trên máy
- Hiển thị: Repository, Tag, Image ID, Size

```bash
docker images -a
```

- Bao gồm cả intermediate images

### 2. **Pull/Push images**

```bash
docker pull nginx:alpine
```

- Tải image từ Docker Hub

```bash
docker push myusername/myapp:latest
```

- Đẩy image lên Docker Hub

### 3. **Build image**

```bash
docker build -t myapp:v1.0 .
```

- `-t` (tag): Đặt tên và tag cho image
- `.`: Build context (thư mục chứa Dockerfile)

```bash
docker build --no-cache -t myapp:v1.0 .
```

- Không dùng cache, build từ đầu

```bash
docker build -f Dockerfile.dev -t myapp:dev .
```

- `-f`: Chỉ định Dockerfile khác (không phải default)

### 4. **Xóa images**

```bash
docker rmi <image_id>
```

- Xóa image

```bash
docker rmi -f <image_id>
```

- Force delete

```bash
docker image prune
```

- Xóa tất cả images không dùng (dangling images)

```bash
docker image prune -a
```

- Xóa **tất cả** images không được container nào sử dụng

### 5. **Inspect image**

```bash
docker inspect <image_id>
```

- Xem metadata chi tiết của image (layers, env vars, etc.)

```bash
docker history <image_id>
```

- Xem lịch sử build layers

---

## 🌐 Docker Network Commands

### 1. **Liệt kê networks**

```bash
docker network ls
```

- Liệt kê tất cả networks

### 2. **Tạo network**

```bash
docker network create mynetwork
```

- Tạo bridge network mới

### 3. **Kết nối container vào network**

```bash
docker network connect mynetwork <container_id>
```

### 4. **Xem chi tiết network**

```bash
docker network inspect mynetwork
```

- Xem containers kết nối, IP addresses, etc.

### 5. **Xóa network**

```bash
docker network rm mynetwork
```

```bash
docker network prune
```

- Xóa tất cả networks không dùng

---

## 💾 Docker Volume Commands

### 1. **Liệt kê volumes**

```bash
docker volume ls
```

### 2. **Tạo volume**

```bash
docker volume create myvolume
```

### 3. **Xem chi tiết volume**

```bash
docker volume inspect myvolume
```

- Xem mountpoint, driver, etc.

### 4. **Xóa volume**

```bash
docker volume rm myvolume
```

```bash
docker volume prune
```

- ⚠️ Xóa **tất cả** volumes không được sử dụng

---

## 🧹 Docker System Commands

### 1. **Xem disk usage**

```bash
docker system df
```

- Xem dung lượng đĩa sử dụng bởi images, containers, volumes

```bash
docker system df -v
```

- Xem chi tiết từng item

### 2. **Cleanup toàn bộ**

```bash
docker system prune
```

- Xóa:
  - Stopped containers
  - Dangling images
  - Unused networks
  - Build cache

```bash
docker system prune -a
```

- Xóa thêm **tất cả** images không dùng

```bash
docker system prune -a --volumes
```

- ⚠️ Xóa luôn **volumes** (mất data!)

### 3. **Xem thông tin hệ thống**

```bash
docker info
```

- Thông tin Docker daemon, số containers, images, etc.

```bash
docker version
```

- Phiên bản Docker client và server

---

## 🎯 Use Cases phổ biến cho dự án Livestream

### 1. **Development workflow hàng ngày**

```bash
# Sáng: Khởi động project
docker-compose up -d

# Sửa code backend → Rebuild
docker-compose up -d --build --no-deps backend

# Xem logs khi debug
docker-compose logs -f backend

# Tối: Dừng project
docker-compose stop
```

### 2. **Khi database bị lỗi**

```bash
# Vào PostgreSQL container
docker exec -it livestream-postgres psql -U livestream_user -d livestream_db

# Hoặc reset database hoàn toàn
docker-compose down -v
docker-compose up -d
```

### 3. **Khi update dependencies**

```bash
# Backend: Update pom.xml → Rebuild no cache
docker-compose build --no-cache backend
docker-compose up -d backend

# Frontend: Update package.json
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### 4. **Cleanup khi máy đầy bộ nhớ**

```bash
# Xóa tất cả (GIỮ volumes/data)
docker-compose down
docker system prune -a

# Xóa hoàn toàn (MẤT data!)
docker-compose down -v
docker system prune -a --volumes
```

### 5. **Production deployment**

```bash
# Build optimized images
docker-compose -f docker-compose.prod.yml build --no-cache

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Monitor logs
docker-compose -f docker-compose.prod.yml logs -f

# Backup database
docker exec livestream-postgres pg_dump -U livestream_user livestream_db > backup.sql
```

### 6. **Debug khi container crash**

```bash
# Xem logs container vừa crash
docker logs <container_id>

# Xem events
docker events --filter 'container=livestream-backend'

# Restart với logs
docker-compose restart backend && docker-compose logs -f backend
```

---

## 📌 Best Practices

### ✅ Do

- Luôn dùng `docker-compose down` thay vì `docker-compose stop` để cleanup
- Dùng `-d` (detached) trong production
- Dùng `--build` khi code thay đổi
- Backup volumes trước khi `docker-compose down -v`
- Dùng `.dockerignore` để giảm build context size

### ❌ Don't

- Không dùng `docker-compose down -v` trừ khi muốn reset database
- Không để containers chạy mãi không dùng (tốn RAM)
- Không commit sensitive data trong images
- Không dùng `latest` tag trong production

---

## 🔍 Troubleshooting Commands

```bash
# Container không start
docker-compose up backend  # Không dùng -d để xem lỗi

# Port bị chiếm
docker ps -a  # Tìm container nào đang dùng port
netstat -tulpn | grep :8080  # Xem process nào dùng port

# Network issues
docker network inspect bridge
docker-compose exec backend ping postgres

# Disk full
docker system df
docker system prune -a

# Logs quá nhiều
docker-compose logs --tail=50 backend
```

---

**Happy Docker-ing! 🐳🚀**
