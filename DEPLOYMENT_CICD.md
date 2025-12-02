# 🚀 HƯỚNG DẪN DEPLOY CI/CD - CLB Gà Chọi Cao Đổi

## 📋 MỤC LỤC

1. [Tổng quan](#-tổng-quan)
2. [Yêu cầu](#-yêu-cầu)
3. [Workflow CI/CD](#-workflow-cicd)
4. [Cấu hình GitHub](#️-cấu-hình-github)
5. [Cấu hình VPS](#-cấu-hình-vps)
6. [Deploy lần đầu](#-deploy-lần-đầu)
7. [Deploy tự động](#-deploy-tự-động)
8. [Kiểm tra & Giám sát](#-kiểm-tra--giám-sát)
9. [Troubleshooting](#-troubleshooting)
10. [So sánh Manual vs CI/CD](#-so-sánh-manual-vs-cicd)

---

## 🎯 TỔNG QUAN

### CI/CD là gì?

**CI/CD** = Continuous Integration / Continuous Deployment

- **CI (Continuous Integration)**: Tự động build và test code mỗi khi có thay đổi
- **CD (Continuous Deployment)**: Tự động deploy lên production server

### Workflow

```
Developer → git push → GitHub Actions → Build Images → Push to Registry → Deploy to VPS → ✅ LIVE
```

### So với Manual Deployment

| Tính năng            | Manual    | CI/CD          |
| -------------------- | --------- | -------------- |
| **Thời gian deploy** | 5-10 phút | < 2 phút       |
| **Tự động hóa**      | ❌ Không  | ✅ Hoàn toàn   |
| **Rollback**         | Khó       | Dễ dàng        |
| **Build trên**       | VPS       | GitHub Actions |
| **Code trên VPS**    | ✅ Cần    | ❌ Không cần   |

---

## 📦 YÊU CẦU

### 1. Infrastructure

- ✅ VPS đã cài Docker + Docker Compose
- ✅ Domain đã trỏ DNS về VPS
- ✅ SSL certificate (Let's Encrypt)
- ✅ CloudFlare (tùy chọn)

### 2. GitHub Repository

- ✅ Code đã push lên GitHub
- ✅ Repository: `cuong78/livestream`
- ✅ Branch: `main`

### 3. Files cần thiết

```
livestream/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow ✨ NEW
├── docker-compose.cicd.yml     # Docker Compose cho CI/CD ✨ NEW
├── deploy-cicd.sh              # Script deploy trên VPS ✨ NEW
├── nginx-prod.conf             # Nginx config
├── srs.conf                    # SRS config
├── .env.example                # Template environment variables
├── livestream-backend/
│   ├── Dockerfile
│   └── ...
└── livestream-frontend/
    ├── Dockerfile
    └── ...
```

---

## 🔄 WORKFLOW CI/CD

### Luồng hoạt động chi tiết

```mermaid
graph LR
    A[Developer: git push] --> B[GitHub Actions: Trigger]
    B --> C[Build Backend Image]
    B --> D[Build Frontend Image]
    C --> E[Push to GHCR]
    D --> E
    E --> F[SSH to VPS]
    F --> G[Pull Images]
    G --> H[Restart Containers]
    H --> I[Health Check]
    I --> J[✅ Deployment Complete]
```

### Các bước tự động

1. **Trigger**: Git push lên `main` branch
2. **Build**: GitHub Actions build Docker images
3. **Push**: Push images lên GitHub Container Registry (GHCR)
4. **Deploy**: SSH vào VPS, pull images mới, restart containers
5. **Verify**: Health check các services
6. **Cleanup**: Xóa images cũ

---

## ⚙️ CẤU HÌNH GITHUB

### BƯỚC 1: Enable GitHub Container Registry

GitHub Container Registry (GHCR) được enable mặc định, không cần setup gì thêm.

### BƯỚC 2: Tạo SSH Key cho VPS

khi mua hoặc thuê vps sẽ có bước này

.pub ( copy vào vps )
.private (copy vào github ) ở bước 3 sẽ hiểu

### BƯỚC 3: Cấu hình GitHub Secrets

Vào GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Tạo các secrets sau:

#### 1. `VPS_HOST`

```
72.62.65.86
```

#### 2. `VPS_USERNAME`

```
root
```

#### 3. `VPS_PORT`

```
22
```

#### 4. `SSH_PRIVATE_KEY`

```
-----BEGIN OPENSSH PRIVATE KEY-----
(paste toàn bộ nội dung từ ~/.ssh/github_actions)
-----END OPENSSH PRIVATE KEY-----
```

#### 5. `DOMAIN`

```
domainCuaban
```

#### 6. `VITE_API_URL`

```
https://domainCuaban/api
```

#### 7. `VITE_WS_URL`

```
wss://domainCuaban/api/ws
```

#### 8. `VITE_HLS_BASE_URL`

```
https://domainCuaban/hls
```

### BƯỚC 4: Kiểm tra Secrets

Sau khi tạo, bạn sẽ thấy danh sách:

```
✅ VPS_HOST
✅ VPS_USERNAME
✅ VPS_PORT
✅ SSH_PRIVATE_KEY
✅ DOMAIN
✅ VITE_API_URL
✅ VITE_WS_URL
✅ VITE_HLS_BASE_URL
```

---

## 🖥️ CẤU HÌNH VPS

### BƯỚC 1: SSH vào VPS

```bash
ssh root@72.62.65.86
```

### BƯỚC 2: Tạo thư mục cho CI/CD

```bash
# Tạo thư mục
mkdir -p /opt/livestream-cicd
cd /opt/livestream-cicd

# Tạo thư mục cho backups
mkdir -p backups
```

### BƯỚC 3: Tạo file .env

```bash
nano /opt/livestream-cicd/.env
```

Paste nội dung sau (thay thế các giá trị):

```bash
# Database Configuration
DB_NAME=livestream_db
DB_USERNAME=livestream_user
DB_PASSWORD=**Generate secure secrets:**
DB_URL=jdbc:postgresql://postgres:5432/livestream_db

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=**Generate secure secrets:**

# JWT Configuration
JWT_SECRET=**Generate secure secrets:**
JWT_EXPIRATION=86400000

# CORS Configuration
CORS_ORIGINS=https://domainCuaban,https://www.domainCuaban

# Domain Configuration
DOMAIN=domainCuaban

# Frontend Build Arguments
VITE_API_URL=https://domainCuaban/api
VITE_WS_URL=wss://domainCuaban/api/ws
VITE_HLS_BASE_URL=https://domainCuaban/hls

# Streaming Configuration
STREAM_HLS_BASE_URL=https://domainCuaban/hls
```

**Generate secure secrets:**

```bash
# Database Password
openssl rand -base64 32

# Redis Password
openssl rand -base64 32

# JWT Secret (phải trên 1 dòng!)
openssl rand -base64 64 | tr -d '\n'
```

Lưu file: `Ctrl+O`, `Enter`, `Ctrl+X`

### BƯỚC 4: Verify .env file

```bash
cat /opt/livestream-cicd/.env
```

Kiểm tra:

- ✅ Tất cả giá trị đã được thay thế (không còn `<GENERATE_WITH...>`)
- ✅ JWT_SECRET trên 1 dòng (không có line break)
- ✅ Domain đúng (domainCuaban)

### BƯỚC 5: Tạo GitHub Personal Access Token (PAT)

Để VPS có thể pull Docker images từ GitHub Container Registry (GHCR), bạn cần tạo Personal Access Token:

**Trên GitHub:**

1. Click vào **avatar** (góc phải) → **Settings**
2. Scroll xuống dưới → **Developer settings** (menu bên trái)
3. Click **Personal access tokens** → **Tokens (classic)**
4. Click **Generate new token** → **Generate new token (classic)**
5. Điền thông tin:
   - **Note**: `VPS GHCR Access Token`
   - **Expiration**: `No expiration` (hoặc tùy chọn)
   - **Select scopes**:
     - ✅ `read:packages` (bắt buộc - để pull images)
     - ✅ `write:packages` (tùy chọn - nếu muốn push từ VPS)
6. Click **Generate token**
7. **⚠️ COPY TOKEN NGAY** - Chỉ hiện 1 lần duy nhất!

### BƯỚC 6: Login vào GHCR trên VPS

```bash
# Login vào GitHub Container Registry
# Thay <YOUR_GITHUB_PAT> bằng token vừa tạo
echo "<YOUR_GITHUB_PAT>" | docker login ghcr.io -u nameGithub --password-stdin
```

**Kết quả mong đợi:**

```
WARNING! Your password will be stored unencrypted in /root/.docker/config.json.
Configure a credential helper to remove this warning. See
https://docs.docker.com/engine/reference/commandline/login/#credentials-store

Login Succeeded
```

**Lưu ý:** Token sẽ được lưu trong `/root/.docker/config.json`, VPS sẽ tự động dùng để pull images sau này.

### BƯỚC 7: Kiểm tra SSL Certificate

```bash
ls -la /etc/letsencrypt/live/domainCuaban/
```

**Kết quả mong đợi:**

```
lrwxrwxrwx 1 root root   37 ... cert.pem -> ../../archive/domainCuaban/cert1.pem
lrwxrwxrwx 1 root root   38 ... chain.pem -> ../../archive/domainCuaban/chain1.pem
lrwxrwxrwx 1 root root   42 ... fullchain.pem -> ../../archive/domainCuaban/fullchain1.pem
lrwxrwxrwx 1 root root   40 ... privkey.pem -> ../../archive/domainCuaban/privkey1.pem
```

**Nếu chưa có SSL certificate:**

```bash
# Stop Nginx nếu đang chạy
docker stop livestream-frontend 2>/dev/null || true

# Cài Certbot
apt-get update
apt-get install -y certbot

# Tạo certificate
certbot certonly --standalone -d domainCuaban -d www.domainCuaban --agree-tos --email your-email@example.com

# Setup auto-renewal
echo "0 3 * * * certbot renew --quiet --deploy-hook 'docker restart livestream-frontend'" | crontab -
```

---

## 🎬 DEPLOY LẦN ĐẦU

### BƯỚC 1: Commit và Push Code lên GitHub

**⚠️ QUAN TRỌNG:** Push code lên GitHub trước để GitHub Actions tự động copy config files xuống VPS!

```bash
# Trên máy local Windows
cd d:/github/liveStream

# Kiểm tra branch hiện tại
git branch

# Đảm bảo đang ở branch main
git checkout main

# Kiểm tra các file mới
git status

# Add tất cả files
git add .

# Commit
git commit -m "Setup CI/CD deployment with GitHub Actions"

# Push to GitHub main branch
git push origin main
```

### BƯỚC 2: Theo dõi GitHub Actions Build Images

Vào GitHub repository → **Actions**

Bạn sẽ thấy workflow **"Deploy to Production"** đang chạy.

**⚠️ LƯU Ý:** Lần chạy đầu tiên sẽ **BỊ LỖI** ở bước Deploy (do VPS chưa login GHCR), nhưng images đã được build và push lên GHCR thành công!

**Các giai đoạn:**

1. ✅ **Build and Push** (5-8 phút) - SẼ THÀNH CÔNG

   - Build backend image
   - Build frontend image
   - Push to GHCR: `ghcr.io/cuong78/livestream-backend:latest`
   - Push to GHCR: `ghcr.io/cuong78/livestream-frontend:latest`

2. ❌ **Deploy** - SẼ BỊ LỖI (bình thường, sửa ở bước 3)
   - Copy files to VPS: ✅ Thành công
   - Pull images: ❌ Lỗi `denied` (chưa login GHCR)

**Chờ workflow chạy xong (khoảng 10 phút), sau đó tiếp tục bước 3.**

### BƯỚC 3: Pull Images và Start Containers trên VPS

**Quay lại VPS**, bây giờ config files đã được GitHub Actions copy xuống:

```bash
cd /opt/livestream-cicd

# Kiểm tra files đã được copy
ls -la

# Bạn sẽ thấy:
# - docker-compose.cicd.yml ✅
# - nginx-prod.conf ✅
# - srs.conf ✅

# Pull images từ GHCR (đã login ở Bước 6)
docker-compose -f docker-compose.cicd.yml pull

# Start containers
docker-compose -f docker-compose.cicd.yml up -d

# Đợi 30 giây để services khởi động
sleep 30

# Kiểm tra containers
docker-compose -f docker-compose.cicd.yml ps
```

### BƯỚC 4: Theo dõi deployment

Vào GitHub repository → **Actions**

Bạn sẽ thấy workflow **"Deploy to Production"** đang chạy.

**Các giai đoạn:**

1. ✅ **Build and Push** (5-8 phút)

   - Build backend image
   - Build frontend image
   - Push to GHCR

2. ✅ **Deploy** (2-3 phút)
   - Copy files to VPS
   - Pull images
     **Lần deploy đầu tiên:** ~10-15 phút (build images + manual pull)  
     **Lần deploy sau:** ~3-5 phút (có cache + tự động hoàn toàn)

### BƯỚC 5: Kiểm tra Containers

**Tổng thời gian: ~10 phút** (lần đầu, lần sau chỉ 3-5 phút nhờ cache)

### BƯỚC 4: Kiểm tra trên VPS

```bash
ssh root@72.62.65.86
cd /opt/livestream-cicd

# Xem containers
docker-compose -f docker-compose.cicd.yml ps

# Xem logs
docker-compose -f docker-compose.cicd.yml logs -f --tail=50
```

**Kết quả mong đợi:**

```
NAME                      STATUS              PORTS
livestream-srs            Up                  0.0.0.0:1935->1935/tcp, 1985/tcp
```

### BƯỚC 6: Test Website Up (healthy) 6379/tcp

livestream-srs Up 0.0.0.0:1935->1935/tcp, 1985/tcp

```

### BƯỚC 5: Test website

Mở trình duyệt:

```

https://domainCuaban

````

Kiểm tra:

- ✅ Website hiển thị
- ✅ HTTPS có icon 🔒
- ✅ Không có certificate warning
- ✅ Video player hiển thị (nếu có stream)

### BƯỚC 7: Re-run GitHub Actions (Để test deployment tự động)

Bây giờ VPS đã login GHCR và có đầy đủ config files, hãy test lại deployment:

**Vào GitHub → Actions:**

1. Click vào workflow run vừa bị lỗi
2. Click **Re-run jobs** → **Re-run failed jobs**
3. Lần này sẽ thành công 100%! ✅

Hoặc đơn giản hơn, push 1 commit nhỏ:

```bash
# Trên máy local
cd d:/github/liveStream

# Tạo commit nhỏ
git commit --allow-empty -m "Test CI/CD deployment"
git push origin main
````

Workflow sẽ chạy lại và lần này sẽ hoàn toàn tự động! 🎉

-

### Theo dõi deployment

Vào GitHub → **Actions** để xem tiến trình real-time.

Hoặc enable notifications:

- Repository → **Settings** → **Notifications**
- Enable **Email notifications**

### Rollback nếu có lỗi

**Cách 1: Revert commit**

```bash
# Trên máy local
git revert HEAD
git push origin main

# GitHub Actions sẽ tự động deploy lại version trước
```

**Cách 2: Deploy tag cũ**

```bash
# Tạo tag cho version hiện tại
git tag v1.0.0
git push origin v1.0.0

# Nếu cần rollback về v1.0.0
git checkout v1.0.0
git push origin main --force
```

**Cách 3: Manual rollback trên VPS**

```bash
ssh root@72.62.65.86
cd /opt/livestream-cicd

# Pull image cũ hơn
docker pull ghcr.io/cuong78/livestream-backend:main-<old-sha>
docker pull ghcr.io/cuong78/livestream-frontend:main-<old-sha>

# Restart với image cũ (cần update docker-compose.cicd.yml)
docker-compose -f docker-compose.cicd.yml up -d
```

---

## 📊 KIỂM TRA & GIÁM SÁT

### Kiểm tra logs trên GitHub Actions

GitHub → **Actions** → Click vào workflow run → Xem logs từng step

### Kiểm tra containers trên VPS

```bash
ssh root@72.62.65.86
cd /opt/livestream-cicd

# Status
docker-compose -f docker-compose.cicd.yml ps

# Logs tất cả services
docker-compose -f docker-compose.cicd.yml logs -f

# Logs 1 service cụ thể
docker-compose -f docker-compose.cicd.yml logs -f backend

# Logs 50 dòng cuối
docker-compose -f docker-compose.cicd.yml logs --tail=50 backend
```

### Health checks

```bash
# Backend API
curl https://domainCuaban/api/actuator/health

# Frontend
curl -I https://domainCuaban

# WebSocket
curl https://domainCuaban/api/ws/chat/info

# HLS endpoint
curl -I https://domainCuaban/hls/
```

**Kết quả mong đợi:**

```json
// Backend
{"status":"UP"}

// Frontend
HTTP/2 200

// WebSocket
HTTP/2 200

// HLS
HTTP/2 200
```

### Monitoring tài nguyên

```bash
# CPU và Memory usage
docker stats

# Disk usage
df -h

# Docker disk usage
docker system df
```

---

## 🐛 TROUBLESHOOTING

### Lỗi 1: GitHub Actions không thể SSH vào VPS

**Triệu chứng:**

### Lỗi 2: Cannot pull images từ GHCR

**Triệu chứng:**

```
Error response from daemon: denied
# hoặc
Error response from daemon: unauthorized: authentication required
```

**Nguyên nhân:** VPS chưa login vào GitHub Container Registry.

**Giải pháp:**

1. Tạo GitHub Personal Access Token (nếu chưa có):

   - GitHub → Settings → Developer settings → Personal access tokens
   - Generate new token (classic)
   - Chọn scope: `read:packages`

2. Login vào GHCR trên VPS:

```bash
# Thay <YOUR_GITHUB_PAT> bằng token vừa tạo
echo "<YOUR_GITHUB_PAT>" | docker login ghcr.io -u cuong78 --password-stdin
```

3. Pull lại images:

````bash
cd /opt/livestream-cicd
docker-compose -f docker-compose.cicd.yml pull
docker-compose -f docker-compose.cicd.yml up -d
``` -i ~/.ssh/github_actions root@72.62.65.86
````

3. Kiểm tra GitHub Secret `SSH_PRIVATE_KEY`:
   - Phải có `-----BEGIN OPENSSH PRIVATE KEY-----`
   - Phải có `-----END OPENSSH PRIVATE KEY-----`
   - Không có khoảng trắng thừa

### Lỗi 2: Cannot pull images từ GHCR

**Triệu chứng:**

```
Error response from daemon: unauthorized: authentication required
```

**Giải pháp:**

```bash
# Trên VPS, login to GHCR
echo "<YOUR_GITHUB_TOKEN>" | docker login ghcr.io -u cuong78 --password-stdin

# Hoặc GitHub Actions sẽ tự động login
```

### Lỗi 3: Containers không healthy

**Triệu chứng:**

```
livestream-backend   Up (unhealthy)
```

**Giải pháp:**

```bash
# Xem logs
docker logs livestream-backend

# Restart container
docker restart livestream-backend

# Nếu vẫn lỗi, check health endpoint
docker exec livestream-backend curl localhost:8080/api/actuator/health
```

### Lỗi 4: Frontend không kết nối được backend

**Triệu chứng:**

- Console error: `Failed to fetch`
- Network error khi call API

**Giải pháp:**

1. Kiểm tra VITE environment variables trong GitHub Secrets
2. Kiểm tra nginx-prod.conf proxy config
3. Restart frontend container:

```bash
docker restart livestream-frontend
```

### Lỗi 5: SSL certificate expired

**Triệu chứng:**

```
ERR_CERT_DATE_INVALID
```

**Giải pháp:**

```bash
# Renew certificate
certbot renew --force-renewal

# Restart frontend
docker restart livestream-frontend

# Check expiry
certbot certificates
```

### Lỗi 6: Out of disk space

**Triệu chứng:**

```
no space left on device
```

**Giải pháp:**

```bash
# Cleanup Docker
docker system prune -af
docker volume prune -f

# Remove old images
docker image prune -af --filter "until=72h"

# Check disk
df -h
```

### Lỗi 7: Database connection failed

**Triệu chứng:**

```
java.sql.SQLException: Connection refused
```

**Giải pháp:**

```bash
# Check PostgreSQL container
docker logs livestream-postgres

# Check environment variables
docker exec livestream-backend env | grep DB

# Restart both
docker restart livestream-postgres
sleep 10
docker restart livestream-backend
```

### Lỗi 8: GitHub Actions workflow không chạy

**Triệu chứng:**

- Push code nhưng không thấy workflow chạy

**Giải pháp:**

1. Kiểm tra file `.github/workflows/deploy.yml` đã commit chưa
2. Kiểm tra branch trigger trong workflow (phải là `main`)
3. Vào GitHub → **Actions** → Enable workflows nếu bị disable

### Lỗi 9: Build timeout trên GitHub Actions

**Triệu chứng:**

```
Error: The operation was canceled.
```

**Giải pháp:**

1. Build lại (thường do network issue):

   - Vào **Actions** → Click workflow → **Re-run jobs**

2. Enable GitHub Actions cache (đã có trong workflow)

3. Optimize Dockerfile (đã optimize rồi)

---

## 📈 SO SÁNH MANUAL VS CI/CD

### Thời gian

| Tác vụ               | Manual         | CI/CD        | Tiết kiệm   |
| -------------------- | -------------- | ------------ | ----------- |
| **Build backend**    | 3-5 phút       | 3-4 phút     | Tương đương |
| **Build frontend**   | 2-3 phút       | 2-3 phút     | Tương đương |
| **Transfer code**    | 1 phút         | 0 phút       | ✅ 100%     |
| **Restart services** | 1-2 phút       | 30s          | ✅ 75%      |
| **Verification**     | 2 phút         | 30s          | ✅ 75%      |
| **Manual commands**  | 5 phút         | 0 phút       | ✅ 100%     |
| **TỔNG**             | **14-18 phút** | **6-8 phút** | ✅ **~60%** |

### Effort

| Tác vụ                 | Manual | CI/CD      |
| ---------------------- | ------ | ---------- |
| **SSH vào VPS**        | ✅ Cần | ❌ Không   |
| **Pull code**          | ✅ Cần | ❌ Không   |
| **Build images**       | ✅ Cần | ❌ Tự động |
| **Restart containers** | ✅ Cần | ❌ Tự động |
| **Health check**       | ✅ Cần | ❌ Tự động |
| **Monitor**            | ✅ Cần | ✅ Cần     |

### Độ tin cậy

| Khía cạnh          | Manual                       | CI/CD               |
| ------------------ | ---------------------------- | ------------------- |
| **Consistency**    | ⚠️ Phụ thuộc người thực hiện | ✅ Luôn giống nhau  |
| **Error handling** | ⚠️ Thủ công                  | ✅ Tự động rollback |
| **Audit trail**    | ❌ Không có                  | ✅ Có logs đầy đủ   |
| **Testing**        | ⚠️ Thủ công                  | ✅ Automated tests  |

### Khả năng mở rộng

| Feature                   | Manual                | CI/CD                      |
| ------------------------- | --------------------- | -------------------------- |
| **Multiple environments** | ⚠️ Khó                | ✅ Dễ (dev, staging, prod) |
| **Team collaboration**    | ⚠️ Conflict dễ xảy ra | ✅ Tự động merge & deploy  |
| **Blue-green deployment** | ❌ Không hỗ trợ       | ✅ Có thể config           |
| **Canary deployment**     | ❌ Không hỗ trợ       | ✅ Có thể config           |

---

## 🎓 BEST PRACTICES

### 1. Branching Strategy

Sử dụng Git Flow:

```
main (production)
  ↑
  develop (staging)
    ↑
    feature/new-feature (development)
```

Config workflow để deploy từng branch:

```yaml
on:
  push:
    branches:
      - main # Auto-deploy to production
      - develop # Auto-deploy to staging
```

### 2. Environment Variables

Không hardcode trong code:

```java
// ❌ BAD
String apiUrl = "https://domainCuaban/api";

// ✅ GOOD
@Value("${app.api.url}")
private String apiUrl;
```

### 3. Health Checks

Implement health endpoints:

```java
@RestController
@RequestMapping("/api/actuator")
public class HealthController {
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }
}
```

### 4. Logging

Sử dụng structured logging:

```java
// ✅ GOOD
log.info("User logged in: userId={}, ip={}", userId, ipAddress);
```

### 5. Monitoring

Setup Prometheus + Grafana (optional):

```yaml
# docker-compose.cicd.yml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
```

### 6. Backup

Tự động backup database:

```bash
# Crontab
0 2 * * * cd /opt/livestream-cicd && ./backup.sh
```

### 7. Security

- Không commit `.env` file
- Rotate secrets định kỳ

### Cấu hình VPS

- [ ] Thư mục `/opt/livestream-cicd` đã tạo
- [ ] File `.env` đã tạo với secrets
- [ ] GitHub Personal Access Token (PAT) đã tạo
- [ ] VPS đã login vào GHCR với PAT
- [ ] SSL certificate đã có tại `/etc/letsencrypt/`
- [ ] Docker và Docker Compose đã cài
- [ ] UFW firewall đã config (ports 22, 80, 443, 1935)

### Deploy lần đầu

- [ ] Push code lên GitHub main branch
- [ ] GitHub Actions build images thành công
- [ ] Config files đã được copy xuống VPS
- [ ] Pull images thành công trên VPS
- [ ] 5 containers đang chạy:fig:
  - [ ] VPS_HOST
  - [ ] VPS_USERNAME
  - [ ] VPS_PORT
  - [ ] SSH_PRIVATE_KEY
  - [ ] DOMAIN
  - [ ] VITE_API_URL
  - [ ] VITE_WS_URL
  - [ ] VITE_HLS_BASE_URL
- [ ] SSH key đã tạo và add vào VPS
- [ ] Test SSH connection thành công

### Cấu hình VPS

- [ ] Thư mục `/opt/livestream-cicd` đã tạo
- [ ] File `.env` đã tạo với secrets
- [ ] SSL certificate đã có tại `/etc/letsencrypt/`
- [ ] Docker và Docker Compose đã cài
- [ ] UFW firewall đã config (ports 22, 80, 443, 1935)
- [ ] Auto-renewal SSL đã setup (crontab)

### Deploy lần đầu

- [ ] Push code lên GitHub
- [ ] GitHub Actions workflow chạy thành công
- [ ] 5 containers đang chạy:
  - [ ] livestream-postgres (healthy)
  - [ ] livestream-redis (healthy)
  - [ ] livestream-srs
  - [ ] livestream-backend (healthy)
  - [ ] livestream-frontend
- [ ] Website accessible tại https://domainCuaban
- [ ] HTTPS có icon 🔒
- [ ] Backend API responding
- [ ] WebSocket chat hoạt động

### Testing

- [ ] Frontend hiển thị đúng
- [ ] Login hoạt động
- [ ] Chat real-time hoạt động
- [ ] Stream RTMP → HLS hoạt động
- [ ] Mobile responsive
- [ ] Performance acceptable

---

## 🚀 NEXT STEPS

Sau khi hoàn thành CI/CD deployment, bạn có thể:

1. **Setup staging environment**

   - Tạo branch `develop`
   - Config workflow deploy to staging server
   - Test trước khi merge vào `main`

2. **Enable automated testing**

   - Unit tests
   - Integration tests
   - E2E tests với Selenium/Cypress

3. **Setup monitoring**

### Những gì đã làm

✅ Tạo GitHub Actions workflow tự động build & deploy  
✅ Setup GitHub Container Registry (GHCR)  
✅ Tạo GitHub Personal Access Token (PAT) để pull images  
✅ Config SSH key cho GitHub Actions  
✅ Tạo docker-compose.cicd.yml dùng pre-built images  
✅ Tạo script deploy-cicd.sh tự động  
✅ Config GitHub Secrets (8 secrets)  
✅ Setup VPS với thư mục /opt/livestream-cicd  
✅ Tạo file .env với secure secrets  
✅ VPS login vào GHCR với PAT

### Deploy workflow

```
1. Developer: git push origin main (máy local)
2. GitHub Actions:
   - Build backend & frontend images
   - Push to GHCR (ghcr.io/cuong78/livestream-*)
   - SSH vào VPS
   - Copy config files xuống VPS
   - Pull images mới từ GHCR
   - Restart containers với zero-downtime
   - Health check tất cả services
3. ✅ LIVE in 3-5 minutes!
```

**Lần đầu:** ~10-15 phút (build + setup)  
**Lần sau:** ~3-5 phút (có cache + tự động hoàn toàn)💡 TÓM TẮT

### Những gì đã làm

✅ Tạo GitHub Actions workflow tự động build & deploy  
✅ Setup GitHub Container Registry (GHCR)  
✅ Config SSH key cho GitHub Actions  
✅ Tạo docker-compose.cicd.yml dùng pre-built images  
✅ Tạo script deploy-cicd.sh tự động  
✅ Config GitHub Secrets (8 secrets)  
✅ Setup VPS với thư mục /opt/livestream-cicd  
✅ Tạo file .env với secure secrets

### Deploy workflow

```
1. Developer: git push origin main
2. GitHub Actions: Build images → Push to GHCR
3. GitHub Actions: SSH to VPS → Deploy
4. VPS: Pull images → Restart containers
5. ✅ LIVE in 6-8 minutes!
```

### Lợi ích

- ⚡ **Nhanh hơn 60%** so với manual (6-8 phút vs 14-18 phút)
- 🤖 **Tự động 100%** - Chỉ cần `git push`
- 🔒 **An toàn hơn** - Consistent, có audit trail
- 🔄 **Rollback dễ dàng** - Chỉ cần revert commit
- 📦 **Không cần code trên VPS** - Chỉ cần config files

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:

1. Kiểm tra [Troubleshooting](#-troubleshooting)
2. Xem GitHub Actions logs
3. Check container logs trên VPS
4. Tạo GitHub Issue

---

**🎉 Chúc mừng! Bạn đã hoàn thành setup CI/CD deployment!**

Từ giờ, mỗi khi push code, hệ thống sẽ tự động build và deploy. Enjoy! 🚀
