import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// Configuration
const BASE_URL = __ENV.BASE_URL || "http://localhost:8080/api";
const FRONTEND_URL = __ENV.FRONTEND_URL || "http://localhost:3000";
const HLS_URL = __ENV.HLS_URL || "http://localhost:8081";

// Custom metrics
const loginSuccessRate = new Rate("login_success_rate");
const streamLoadSuccess = new Rate("stream_load_success");
const pageLoadTime = new Trend("page_load_duration");
const apiResponseTime = new Trend("api_response_time");
const totalRequests = new Counter("total_requests");

// Test configuration
export const options = {
  stages: [
    { duration: "30s", target: 50 }, // Ramp up to 50 users
    { duration: "1m", target: 100 }, // Ramp up to 100 users
    { duration: "2m", target: 200 }, // Ramp up to 200 users
    { duration: "1m", target: 100 }, // Ramp down to 100 users
    { duration: "30s", target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    http_req_failed: ["rate<0.1"],
    login_success_rate: ["rate>0.5"],
    stream_load_success: ["rate>0.8"],
  },
};

export default function () {
  // Scenario 1: Homepage Load (40% of users)
  if (Math.random() < 0.4) {
    const startTime = Date.now();
    const homeRes = http.get(FRONTEND_URL);
    pageLoadTime.add(Date.now() - startTime);

    check(homeRes, {
      "Homepage loads": (r) => r.status === 200,
    });
    totalRequests.add(1);
    sleep(2);
  }

  // Scenario 2: Check Stream API (60% of users)
  if (Math.random() < 0.6) {
    const streamRes = http.get(`${BASE_URL}/stream/current`);
    apiResponseTime.add(streamRes.timings.duration);

    const streamSuccess = check(streamRes, {
      "Stream API responds": (r) => r.status === 200,
    });
    streamLoadSuccess.add(streamSuccess);
    totalRequests.add(1);
    sleep(1);
  }

  // Scenario 3: Load HLS manifest (30% of users)
  if (Math.random() < 0.3) {
    const hlsRes = http.get(`${HLS_URL}/live/livestream/index.m3u8`, {
      tags: { name: "HLS_Manifest" },
    });

    check(hlsRes, {
      "HLS manifest available": (r) => r.status === 200 || r.status === 404,
    });
    totalRequests.add(1);
    sleep(3);
  }

  // Scenario 4: User Login (10% of users)
  if (Math.random() < 0.1) {
    const loginPayload = JSON.stringify({
      username: `loadtest${Math.floor(Math.random() * 1000)}`,
      password: "Test123456!",
    });

    const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
      headers: { "Content-Type": "application/json" },
      tags: { name: "Login" },
    });

    const loginSuccess = check(loginRes, {
      "Login attempted": (r) => r.status === 200 || r.status === 401,
    });
    loginSuccessRate.add(loginRes.status === 200);
    apiResponseTime.add(loginRes.timings.duration);
    totalRequests.add(1);
    sleep(2);
  }

  sleep(1);
}

export function handleSummary(data) {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║            QUICK LOAD TEST RESULTS                      ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(
    `║ Total Requests: ${data.metrics.total_requests.values.count}`.padEnd(60) +
      "║"
  );
  console.log(
    `║ Failed Requests: ${(
      data.metrics.http_req_failed.values.rate * 100
    ).toFixed(2)}%`.padEnd(60) + "║"
  );
  console.log(
    `║ Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(
      2
    )}ms`.padEnd(60) + "║"
  );
  console.log(
    `║ P95 Response Time: ${data.metrics.http_req_duration.values[
      "p(95)"
    ].toFixed(2)}ms`.padEnd(60) + "║"
  );
  console.log(
    `║ P99 Response Time: ${data.metrics.http_req_duration.values[
      "p(99)"
    ].toFixed(2)}ms`.padEnd(60) + "║"
  );

  if (data.metrics.login_success_rate) {
    console.log(
      `║ Login Success Rate: ${(
        data.metrics.login_success_rate.values.rate * 100
      ).toFixed(2)}%`.padEnd(60) + "║"
    );
  }

  if (data.metrics.stream_load_success) {
    console.log(
      `║ Stream Load Success: ${(
        data.metrics.stream_load_success.values.rate * 100
      ).toFixed(2)}%`.padEnd(60) + "║"
    );
  }

  console.log("╚══════════════════════════════════════════════════════════╝\n");

  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
