/**
 * k6 Load Test: API Stress Testing
 *
 * Test scenario: Stress test all backend API endpoints
 *
 * Run: k6 run api-load.js
 */

import { check, group, sleep } from "k6";
import http from "k6/http";
import { Rate, Trend } from "k6/metrics";

const loginSuccessRate = new Rate("login_success_rate");
const apiResponseTime = new Trend("api_response_time");

export const options = {
  stages: [
    { duration: "30s", target: 50 }, // Ramp up
    { duration: "1m", target: 100 }, // Normal load
    { duration: "30s", target: 200 }, // Stress
    { duration: "1m", target: 100 }, // Recovery
    { duration: "30s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    http_req_failed: ["rate<0.05"],
    login_success_rate: ["rate>0.9"],
  },
};

const BASE_URL = __ENV.API_URL || "http://localhost:8080/api";

let authToken = null;

export function setup() {
  // Create test user
  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({
      username: `loadtest_${Date.now()}`,
      password: "Test123456!",
      email: `loadtest${Date.now()}@test.com`,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  if (registerRes.status === 200) {
    const data = JSON.parse(registerRes.body);
    return { token: data.token, username: data.username };
  }
  return null;
}

export default function (data) {
  group("Authentication API", () => {
    // Test login
    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({
        username: (data && data.username) || "testuser",
        password: "Test123456!",
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    const loginSuccess = check(loginRes, {
      "Login status 200": (r) => r.status === 200,
      "Login returns token": (r) => {
        if (r.status === 200) {
          const body = JSON.parse(r.body);
          return body.token !== undefined;
        }
        return false;
      },
    });

    loginSuccessRate.add(loginSuccess);
    apiResponseTime.add(loginRes.timings.duration);

    if (loginSuccess && loginRes.status === 200) {
      authToken = JSON.parse(loginRes.body).token;
    }
  });

  group("Stream API", () => {
    // Get current stream
    const streamRes = http.get(`${BASE_URL}/stream/current`);

    check(streamRes, {
      "Stream API responds": (r) => r.status === 200 || r.status === 204,
    });

    apiResponseTime.add(streamRes.timings.duration);

    // Get active streams
    const activeRes = http.get(`${BASE_URL}/stream/active`);
    check(activeRes, {
      "Active streams API responds": (r) => r.status === 200,
    });
  });

  if (authToken) {
    group("Admin API (Authenticated)", () => {
      const headers = {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      };

      // Get blocked IPs
      const blockedIpsRes = http.get(`${BASE_URL}/admin/blocked-ips`, {
        headers,
      });
      check(blockedIpsRes, {
        "Blocked IPs API accessible": (r) =>
          r.status === 200 || r.status === 403,
      });

      // Block IP (test)
      if (Math.random() < 0.05) {
        // 5% probability
        const blockRes = http.post(
          `${BASE_URL}/admin/blocked-ips/block?ipAddress=192.168.1.${Math.floor(
            Math.random() * 255
          )}&reason=Load test&adminUsername=loadtest`,
          null,
          { headers }
        );

        check(blockRes, {
          "Block IP API responds": (r) =>
            r.status === 200 || r.status === 400 || r.status === 403,
        });
      }
    });
  }

  sleep(1);
}

export function teardown(data) {
  // Cleanup: Could delete test users here
  console.log("Load test completed");
}

export function handleSummary(data) {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║            API LOAD TEST RESULTS                        ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(
    `║ Total Requests: ${data.metrics.http_reqs.values.count
      .toString()
      .padEnd(39)} ║`
  );
  console.log(
    `║ Failed Requests: ${data.metrics.http_req_failed.values.count
      .toString()
      .padEnd(38)} ║`
  );
  console.log(
    `║ Avg Response: ${data.metrics.http_req_duration.values.avg.toFixed(
      2
    )}ms${" ".repeat(37)} ║`
  );
  console.log(
    `║ P95 Response: ${data.metrics.http_req_duration.values["p(95)"].toFixed(
      2
    )}ms${" ".repeat(37)} ║`
  );
  console.log(
    `║ P99 Response: ${data.metrics.http_req_duration.values["p(99)"].toFixed(
      2
    )}ms${" ".repeat(37)} ║`
  );
  console.log(
    `║ Login Success Rate: ${(
      data.metrics.login_success_rate.values.rate * 100
    ).toFixed(2)}%${" ".repeat(31)} ║`
  );
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  return {
    "api-load-summary.json": JSON.stringify(data, null, 2),
  };
}
