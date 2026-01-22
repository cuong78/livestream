# Hướng dẫn cấu hình TOKEN cho GitHub Container Registry

## Vấn đề

Lỗi `Error: Error response from daemon: Get "https://ghcr.io/v2/": denied: denied` xảy ra khi:
- Token không có quyền truy cập GitHub Container Registry
- Token chưa được thêm vào GitHub Secrets
- Token đã hết hạn
- Token không có quyền `write:packages` và `read:packages`

## Giải pháp: Tạo Personal Access Token (PAT)

### Bước 1: Tạo Personal Access Token trên GitHub

1. Vào GitHub → Click vào **avatar** (góc trên bên phải) → **Settings**

2. Cuộn xuống bên trái, click **Developer settings**

3. Click **Personal access tokens** → **Tokens (classic)** hoặc **Fine-grained tokens**

4. Click **Generate new token** → Chọn **Generate new token (classic)**

5. Điền thông tin:
   - **Note**: `GitHub Actions - Container Registry` (tên mô tả)
   - **Expiration**: Chọn thời gian (khuyến nghị: 90 days hoặc No expiration)
   - **Select scopes**: Tích các quyền sau:
     - ✅ `write:packages` - Để push Docker images
     - ✅ `read:packages` - Để pull Docker images
     - ✅ `delete:packages` - (Tùy chọn) Để xóa packages cũ
     - ✅ `repo` - (Nếu repository là private) Để truy cập repository

6. Click **Generate token**

7. **QUAN TRỌNG**: Copy token ngay lập tức (chỉ hiển thị 1 lần duy nhất!)
   - Token sẽ có dạng: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Bước 2: Thêm Token vào GitHub Secrets

1. Vào repository trên GitHub

2. Click **Settings** → **Secrets and variables** → **Actions**

3. Click **New repository secret**

4. Điền thông tin:
   - **Name**: `TOKEN` (phải đúng tên này, vì workflow đang dùng `secrets.TOKEN`)
   - **Value**: Paste token bạn đã copy ở Bước 1

5. Click **Add secret**

### Bước 3: Kiểm tra Repository Visibility

Nếu repository của bạn là **private**, đảm bảo:
- Token có quyền `repo`
- Package visibility được set đúng

Để kiểm tra package visibility:
1. Vào repository → **Packages** (bên phải)
2. Click vào package → **Package settings**
3. Đảm bảo visibility phù hợp với nhu cầu

## Cách khác: Sử dụng GITHUB_TOKEN (Không khuyến nghị cho private repos)

GitHub Actions tự động cung cấp `GITHUB_TOKEN`, nhưng có giới hạn:
- ✅ Hoạt động tốt với public repositories
- ❌ Có thể không hoạt động với private repositories
- ❌ Có thể không có đủ quyền cho một số thao tác

Nếu muốn thử dùng `GITHUB_TOKEN` (không cần tạo PAT):
1. Thay `${{ secrets.TOKEN }}` thành `${{ secrets.GITHUB_TOKEN }}` trong workflow
2. Thêm quyền cho job:

```yaml
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
```

## Troubleshooting

### Lỗi "denied: denied"
- ✅ Kiểm tra token đã được thêm vào Secrets với tên `TOKEN`
- ✅ Kiểm tra token có quyền `write:packages` và `read:packages`
- ✅ Kiểm tra token chưa hết hạn
- ✅ Thử tạo token mới nếu token cũ không hoạt động

### Lỗi "unauthorized"
- Token không hợp lệ hoặc đã bị revoke
- Tạo token mới và cập nhật trong Secrets

### Lỗi "not found"
- Repository hoặc package không tồn tại
- Kiểm tra tên repository trong workflow: `${{ github.repository }}`

## Kiểm tra Token hoạt động

Sau khi cấu hình xong, push code lên branch `main` và kiểm tra:
1. Vào tab **Actions** trong repository
2. Xem workflow run
3. Step "Login to GitHub Container Registry" phải pass (có dấu ✓ màu xanh)
4. Step "Build and Push Backend Docker Image" và "Build and Push Frontend Docker Image" phải thành công

## Lưu ý bảo mật

⚠️ **QUAN TRỌNG:**
- **KHÔNG BAO GIỜ** commit token vào code
- **KHÔNG BAO GIỜ** chia sẻ token với ai
- Token chỉ được lưu trong GitHub Secrets
- Nếu token bị lộ, hãy revoke ngay lập tức và tạo token mới
- Đặt expiration date hợp lý cho token
