# 🔒 Security Audit Checklist - Live Stream Platform

## Test Date: ********\_********

## Tester: ********\_********

## Environment: ********\_********

---

## 1. SQL Injection Testing

### 1.1 Authentication Endpoints

- [ ] **Login with SQL injection in username**

  ```
  POST /api/auth/login
  Body: {"username": "admin' OR '1'='1", "password": "anything"}
  Expected: 401 Unauthorized (NOT login success)
  ```

- [ ] **Login with SQL injection in password**

  ```
  POST /api/auth/login
  Body: {"username": "admin", "password": "' OR '1'='1' --"}
  Expected: 401 Unauthorized
  ```

- [ ] **Register with SQL in email**
  ```
  POST /api/auth/register
  Body: {"username": "test", "email": "test'; DROP TABLE users; --", "password": "pass123"}
  Expected: 400 Bad Request or sanitized input
  ```

### 1.2 Stream Endpoints

- [ ] **Get stream with SQL injection**
  ```
  GET /api/stream/1' OR '1'='1
  Expected: 404 or 400 (NOT expose database error)
  ```

### 1.3 Admin Endpoints

- [ ] **Block IP with SQL injection**
  ```
  POST /api/admin/blocked-ips/block?ipAddress=1.1.1.1' OR '1'='1&reason=test
  Expected: Sanitized or rejected
  ```

**Result:** ✅ PASS / ❌ FAIL  
**Notes:** **************************\_\_\_**************************

---

## 2. Cross-Site Scripting (XSS) Testing

### 2.1 Comment XSS

- [ ] **Basic script tag in comment**

  ```
  WebSocket message:
  {"displayName": "test", "content": "<script>alert('XSS')</script>"}
  Expected: Script tag escaped/sanitized in frontend display
  ```

- [ ] **Image onerror XSS**

  ```
  {"displayName": "test", "content": "<img src=x onerror=alert('XSS')>"}
  Expected: HTML escaped
  ```

- [ ] **SVG XSS**
  ```
  {"displayName": "test", "content": "<svg onload=alert('XSS')>"}
  Expected: Sanitized
  ```

### 2.2 Display Name XSS

- [ ] **XSS in display name**
  ```
  {"displayName": "<script>alert(1)</script>", "content": "hello"}
  Expected: Escaped in frontend
  ```

### 2.3 Stored XSS (localStorage)

- [ ] **Check if localStorage data is escaped when rendered**
  ```
  localStorage.setItem('displayName', '<img src=x onerror=alert(1)>')
  Refresh page
  Expected: Display name escaped
  ```

**Result:** ✅ PASS / ❌ FAIL  
**Notes:** **************************\_\_\_**************************

---

## 3. Cross-Site Request Forgery (CSRF)

### 3.1 State-Changing Operations

- [ ] **Block IP without CSRF token**

  ```html
  <form
    action="http://localhost:8080/api/admin/blocked-ips/block"
    method="POST"
  >
    <input name="ipAddress" value="1.1.1.1" />
    <input name="reason" value="CSRF test" />
  </form>
  Expected: Request rejected (need JWT token)
  ```

- [ ] **Delete comment from external site**
  ```
  POST /api/comment/delete from different origin
  Expected: CORS policy blocks or requires authentication
  ```

**Result:** ✅ PASS / ❌ FAIL  
**Notes:** **************************\_\_\_**************************

---

## 4. Authentication & Authorization

### 4.1 JWT Token Security

- [ ] **Access admin endpoints without token**

  ```
  GET /api/admin/blocked-ips
  Expected: 401 Unauthorized or 403 Forbidden
  ```

- [ ] **Use expired JWT token**

  ```
  Authorization: Bearer <expired_token>
  Expected: 401 Unauthorized
  ```

- [ ] **Use modified JWT token**

  ```
  Take valid token, change payload, keep signature
  Expected: 401 Unauthorized (signature validation fails)
  ```

- [ ] **Use token with wrong signature**
  ```
  Authorization: Bearer eyJhbGc....<modified>
  Expected: 401 Unauthorized
  ```

### 4.2 Role-Based Access Control

- [ ] **Regular user accesses admin endpoints**

  ```
  Login as regular user
  GET /api/admin/blocked-ips
  Expected: 403 Forbidden
  ```

- [ ] **Non-admin tries to block IP**
  ```
  POST /api/admin/blocked-ips/block (with non-admin token)
  Expected: 403 Forbidden
  ```

**Result:** ✅ PASS / ❌ FAIL  
**Notes:** **************************\_\_\_**************************

---

## 5. Rate Limiting & DoS Protection

### 5.1 Comment Rate Limiting

- [ ] **Send multiple comments rapidly (same IP)**

  ```
  Send 10 comments in 1 second from same IP
  Expected: Only 1 comment per 3 seconds allowed (others blocked)
  ```

- [ ] **Check Redis rate limit keys**
  ```
  redis-cli KEYS "rate_limit:comment:*"
  Expected: Keys exist and expire after 3 seconds
  ```

### 5.2 Login Rate Limiting

- [ ] **Brute force login attempts**
  ```
  Send 100 login requests with wrong password
  Expected: Account locked or rate limited after X attempts
  ```

**Result:** ✅ PASS / ❌ FAIL  
**Notes:** **************************\_\_\_**************************

---

## 6. Input Validation

### 6.1 Comment Validation

- [ ] **Comment with 0 characters**

  ```
  {"displayName": "test", "content": ""}
  Expected: Rejected (min 1 char)
  ```

- [ ] **Comment with 501+ characters**

  ```
  {"displayName": "test", "content": "a".repeat(501)}
  Expected: Rejected (max 500 chars)
  ```

- [ ] **Comment with phone number**

  ```
  {"displayName": "test", "content": "Call me 0966689355"}
  Expected: Rejected by profanity filter
  ```

- [ ] **Comment with URL**
  ```
  {"displayName": "test", "content": "Visit http://spam.com"}
  Expected: Rejected
  ```

### 6.2 Display Name Validation

- [ ] **Display name > 50 characters**

  ```
  {"displayName": "a".repeat(51), "content": "hello"}
  Expected: Rejected
  ```

- [ ] **Display name with profanity**
  ```
  {"displayName": "fuck", "content": "hello"}
  Expected: Rejected
  ```

**Result:** ✅ PASS / ❌ FAIL  
**Notes:** **************************\_\_\_**************************

---

## 7. WebSocket Security

### 7.1 Connection Security

- [ ] **Connect with blocked IP**

  ```
  Block IP: 192.168.1.100
  Try to connect WebSocket from that IP
  Expected: Connection refused
  ```

- [ ] **Spoof IP in handshake**
  ```
  Send custom X-Forwarded-For header
  Expected: Real IP still captured (not spoofed)
  ```

### 7.2 Message Validation

- [ ] **Send malformed WebSocket message**

  ```
  Send invalid JSON: {invalid
  Expected: Ignored or connection closed gracefully
  ```

- [ ] **Send oversized message (>1MB)**
  ```
  Expected: Rejected or connection closed
  ```

**Result:** ✅ PASS / ❌ FAIL  
**Notes:** **************************\_\_\_**************************

---

## 8. Information Disclosure

### 8.1 Error Messages

- [ ] **Check error responses don't leak sensitive info**
  ```
  Send invalid requests, check if errors expose:
  - Database table names
  - File paths
  - Stack traces
  - Server versions
  Expected: Generic error messages only
  ```

### 8.2 API Endpoints

- [ ] **Check if Swagger UI is disabled in production**

  ```
  GET /api/swagger-ui.html
  Expected: 404 in production
  ```

- [ ] **Check actuator endpoints**
  ```
  GET /actuator
  GET /actuator/health
  GET /actuator/env
  Expected: Only /health public, others protected or disabled
  ```

**Result:** ✅ PASS / ❌ FAIL  
**Notes:** **************************\_\_\_**************************

---

## 9. HTTPS & Transport Security

### 9.1 SSL/TLS Configuration

- [ ] **Check if HTTP redirects to HTTPS**

  ```
  curl http://yourdomain.com
  Expected: 301 redirect to https://
  ```

- [ ] **Check SSL certificate validity**

  ```
  openssl s_client -connect yourdomain.com:443
  Expected: Valid certificate, no warnings
  ```

- [ ] **Test with SSLLabs**
  ```
  https://www.ssllabs.com/ssltest/
  Expected: Grade A or A+
  ```

### 9.2 Security Headers

- [ ] **Check security headers present**
  ```
  curl -I https://yourdomain.com
  Expected headers:
  - Strict-Transport-Security
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Content-Security-Policy
  ```

**Result:** ✅ PASS / ❌ FAIL  
**Notes:** **************************\_\_\_**************************

---

## 10. Dependency Vulnerabilities

### 10.1 Backend Dependencies

- [ ] **Run OWASP Dependency Check**
  ```bash
  mvn org.owasp:dependency-check-maven:check
  Expected: No HIGH or CRITICAL vulnerabilities
  ```

### 10.2 Frontend Dependencies

- [ ] **Run npm audit**

  ```bash
  cd livestream-frontend
  npm audit
  Expected: No HIGH or CRITICAL vulnerabilities
  ```

- [ ] **Check for outdated packages**
  ```bash
  npm outdated
  ```

**Result:** ✅ PASS / ❌ FAIL  
**Notes:** **************************\_\_\_**************************

---

## Summary

| Category               | Pass | Fail | Notes |
| ---------------------- | ---- | ---- | ----- |
| SQL Injection          | ☐    | ☐    |       |
| XSS                    | ☐    | ☐    |       |
| CSRF                   | ☐    | ☐    |       |
| Authentication         | ☐    | ☐    |       |
| Rate Limiting          | ☐    | ☐    |       |
| Input Validation       | ☐    | ☐    |       |
| WebSocket Security     | ☐    | ☐    |       |
| Information Disclosure | ☐    | ☐    |       |
| HTTPS/TLS              | ☐    | ☐    |       |
| Dependencies           | ☐    | ☐    |       |

**Overall Security Score:** **\_**/10

**Critical Issues Found:** **************************\_\_\_**************************

**Recommendations:** **************************\_\_\_**************************

---

**Sign-off:**  
Auditor: ********\_******** Date: ********\_********
