# 🧪 Testing Suite - Load Testing & Security Audit

## 📋 Table of Contents

- [Load Testing với k6](#load-testing-với-k6)
- [Security Testing](#security-testing)
- [How to Run Tests](#how-to-run-tests)
- [Expected Results](#expected-results)

---

## 🚀 Load Testing với k6

### Installation

**Install k6:**

```bash
# Windows (using Chocolatey)
choco install k6

# macOS (using Homebrew)
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Test Scripts

#### 1. Chat Load Test (`chat-load.js`)

Simulates concurrent users sending comments via WebSocket.

**Test Scenario:**

- 20 users → 50 users → 100 users (peak) → 50 users → 0 users
- Duration: ~5 minutes
- Tests: WebSocket connections, comment broadcasting, rate limiting

**Run:**

```bash
cd tests/load
k6 run chat-load.js
```

**Custom load:**

```bash
# Heavy load: 200 concurrent users for 10 minutes
k6 run --vus 200 --duration 10m chat-load.js

# Spike test: Quick ramp to 500 users
k6 run --vus 500 --duration 30s chat-load.js
```

**Metrics:**

- `comment_success_rate` - Should be > 95%
- `comment_duration` - P95 should be < 500ms
- `rate_limit_hits` - Track how many users hit rate limit
- `ws_connection_errors` - Should be < 10

---

#### 2. Viewer Load Test (`viewer-load.js`)

Simulates concurrent viewers watching HLS stream.

**Test Scenario:**

- 100 → 300 → 500 → 800 → 1000 (max) concurrent viewers
- Duration: ~12 minutes
- Tests: Homepage loading, HLS manifest fetching, video segment loading

**Run:**

```bash
cd tests/load
k6 run viewer-load.js
```

**Custom scenarios:**

```bash
# Target 500 viewers for 15 minutes
k6 run --vus 500 --duration 15m viewer-load.js

# Stress test: 1500 concurrent viewers
k6 run --vus 1500 --duration 5m viewer-load.js
```

**Metrics:**

- `stream_load_success_rate` - Should be > 98%
- `stream_load_duration` - P95 should be < 3s
- `hls_segment_errors` - Should be minimal
- `http_req_duration` - P99 should be < 5s

---

#### 3. API Load Test (`api-load.js`)

Stress tests all backend REST API endpoints.

**Test Scenario:**

- 50 → 100 → 200 (stress) → 100 → 0 users
- Duration: ~4 minutes
- Tests: Authentication, stream APIs, admin endpoints

**Run:**

```bash
cd tests/load
k6 run api-load.js
```

**Metrics:**

- `login_success_rate` - Should be > 90%
- `api_response_time` - Average < 200ms
- `http_req_failed` - Should be < 5%

---

### Expected Performance Benchmarks

| Metric                  | Target   | Critical Threshold    |
| ----------------------- | -------- | --------------------- |
| Concurrent Viewers      | 500-1000 | System stable at 1000 |
| Comment Success Rate    | > 95%    | > 90%                 |
| API Response Time (P95) | < 500ms  | < 1000ms              |
| Stream Load Time (P95)  | < 3s     | < 5s                  |
| WebSocket Errors        | < 10     | < 50                  |
| Failed HTTP Requests    | < 2%     | < 5%                  |

---

## 🔒 Security Testing

### Manual Security Audit

Use the comprehensive checklist:

```bash
tests/security/SECURITY_CHECKLIST.md
```

**Key areas:**

1. **SQL Injection** - Test all input fields and query parameters
2. **XSS (Cross-Site Scripting)** - Test comment content, display names
3. **CSRF** - Verify state-changing operations require authentication
4. **Authentication** - Test JWT token validation, expiration
5. **Authorization** - Test role-based access control
6. **Rate Limiting** - Verify rate limits work
7. **Input Validation** - Test max lengths, special characters
8. **WebSocket Security** - Test IP blocking, message validation
9. **Information Disclosure** - Check error messages don't leak info
10. **HTTPS/TLS** - Verify SSL configuration

---

### Automated Security Tests

**Prerequisites:**

```bash
pip install requests colorama
```

**Run:**

```bash
cd tests/security
python security-tests.py --url http://localhost:8080
```

**For production:**

```bash
python security-tests.py --url https://your-production-domain.com
```

**Output:**

```
✓ PASS - SQL Injection in login: admin' OR '1'='1/password
✓ PASS - Admin endpoint requires authentication
✓ PASS - Invalid token rejected
✗ FAIL - Error messages don't leak sensitive info

TEST SUMMARY
============
Total Tests: 15
Passed: 14
Failed: 1
Success Rate: 93.3%
```

---

### OWASP Dependency Check

**Backend (Maven):**

```bash
cd livestream-backend
mvn org.owasp:dependency-check-maven:check
```

**Frontend (npm):**

```bash
cd livestream-frontend
npm audit
npm audit fix  # Fix vulnerabilities automatically
```

---

## 📊 How to Run Tests

### Full Test Suite

```bash
# 1. Ensure services are running
docker-compose up -d

# 2. Run load tests
cd tests/load
k6 run chat-load.js
k6 run viewer-load.js
k6 run api-load.js

# 3. Run security tests
cd ../security
python security-tests.py

# 4. Check dependencies
cd ../../livestream-backend
mvn org.owasp:dependency-check-maven:check

cd ../livestream-frontend
npm audit
```

---

### Continuous Testing (CI/CD)

Add to `.github/workflows/test.yml`:

```yaml
- name: Load Testing
  run: |
    k6 run tests/load/api-load.js

- name: Security Testing
  run: |
    python tests/security/security-tests.py --url http://localhost:8080

- name: Dependency Check
  run: |
    cd livestream-backend
    mvn org.owasp:dependency-check-maven:check
```

---

## 🎯 Expected Results

### Passing Criteria

**Load Tests:**

- ✅ System handles 500 concurrent viewers without degradation
- ✅ Chat system supports 100+ concurrent users
- ✅ API response times stay under 500ms at P95
- ✅ No critical errors or crashes
- ✅ Rate limiting works correctly

**Security Tests:**

- ✅ No SQL injection vulnerabilities
- ✅ XSS attacks blocked/escaped
- ✅ Authentication properly enforced
- ✅ No HIGH/CRITICAL CVEs in dependencies
- ✅ HTTPS configured correctly
- ✅ Security headers present

---

## 📈 Monitoring Results

### k6 Output Files

After running k6 tests:

- `summary.json` - Test summary
- `viewer-load-summary.json` - Viewer test results
- `api-load-summary.json` - API test results

### Analyze Results

```bash
# View k6 summary
cat summary.json | jq .

# Check failed requests
cat summary.json | jq '.metrics.http_req_failed'

# Check response times
cat summary.json | jq '.metrics.http_req_duration'
```

---

## 🔧 Troubleshooting

### k6 Tests Failing

1. **WebSocket connection errors**

   - Check if backend is running
   - Verify WebSocket endpoint: `ws://localhost:8080/api/ws/chat`
   - Check firewall/proxy settings

2. **High response times**

   - Monitor Docker container resources
   - Check database connection pool
   - Verify Redis is running

3. **Rate limit errors**
   - Expected behavior (Redis rate limiting works)
   - Adjust test if needed: `RATE_LIMIT_SECONDS` in ChatController

### Security Tests Failing

1. **SQL injection tests failing**

   - Good! But verify it's not bypassed in other ways

2. **Authentication tests failing**

   - Check JWT secret is set
   - Verify token expiration time

3. **XSS tests failing**
   - Ensure frontend escapes HTML
   - Check profanity filter is active

---

## 📚 Resources

- [k6 Documentation](https://k6.io/docs/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Last Updated:** December 2025  
**Maintained By:** Live Stream Platform Team
