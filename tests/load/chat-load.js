/**
 * k6 Load Test: Chat System
 *
 * Test scenario: Simulate concurrent users sending comments
 *
 * Run: k6 run chat-load.js
 * Run with high load: k6 run --vus 100 --duration 5m chat-load.js
 */

import { check, group, sleep } from "k6";
import http from "k6/http";
import ws from "k6/ws";
import { Rate, Trend, Counter } from "k6/metrics";

// Custom metrics
const commentSuccessRate = new Rate("comment_success_rate");
const commentDuration = new Trend("comment_duration");
const wsConnectionErrors = new Counter("ws_connection_errors");
const rateLimitHits = new Counter("rate_limit_hits");

// Test configuration
export const options = {
  stages: [
    { duration: "30s", target: 20 }, // Ramp-up to 20 users
    { duration: "1m", target: 50 }, // Increase to 50 users
    { duration: "2m", target: 100 }, // Spike to 100 users
    { duration: "1m", target: 50 }, // Scale down to 50
    { duration: "30s", target: 0 }, // Ramp-down to 0
  ],
  thresholds: {
    comment_success_rate: ["rate>0.95"], // 95% success rate
    comment_duration: ["p(95)<500"], // 95% of comments under 500ms
    ws_connection_errors: ["count<10"], // Less than 10 connection errors
    http_req_duration: ["p(99)<1000"], // 99% of requests under 1s
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const WS_URL = __ENV.WS_URL || "ws://localhost:8080";

// Generate random display names and comments
const names = [
  "Cuong",
  "Nam",
  "Linh",
  "Hoa",
  "Tuan",
  "Mai",
  "Khanh",
  "Duc",
  "Phuong",
  "Hung",
];
const comments = [
  "Gà đẹp quá!",
  "Đỉnh cao này!",
  "Hôm nay gà nào thắng?",
  "Live rất mượt!",
  "Chúc ae xem vui!",
  "Gà này khỏe thật!",
  "Cảm ơn bác đã live!",
  "Chất lượng stream tốt!",
  "Hay quá đi!",
  "Đang xem cùng gia đình!",
];

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export default function () {
  const displayName = getRandomItem(names) + Math.floor(Math.random() * 1000);

  group("WebSocket Chat Flow", () => {
    const url = `${WS_URL}/api/ws/chat`;

    const response = ws.connect(url, {}, function (socket) {
      socket.on("open", () => {
        console.log(`Connected: ${displayName}`);

        // Subscribe to STOMP topics
        socket.send(
          JSON.stringify({
            command: "CONNECT",
            headers: {
              "accept-version": "1.1,1.0",
              "heart-beat": "10000,10000",
            },
          })
        );
      });

      socket.on("message", (data) => {
        // Handle incoming messages
        try {
          const message = JSON.parse(data);
          if (message.type === "CONNECTED") {
            // Subscribe to live comments
            socket.send(
              JSON.stringify({
                command: "SUBSCRIBE",
                headers: {
                  destination: "/topic/live-comments",
                  id: "sub-0",
                },
              })
            );

            // Send a comment
            const comment = {
              displayName: displayName,
              content: getRandomItem(comments),
              createdAt: new Date().toISOString(),
            };

            const start = Date.now();
            socket.send(
              JSON.stringify({
                command: "SEND",
                headers: {
                  destination: "/app/comment",
                },
                body: JSON.stringify(comment),
              })
            );

            const duration = Date.now() - start;
            commentDuration.add(duration);
            commentSuccessRate.add(true);
          }
        } catch (e) {
          console.error("Message parse error:", e);
        }
      });

      socket.on("error", (e) => {
        console.error("WebSocket error:", e);
        wsConnectionErrors.add(1);
        commentSuccessRate.add(false);
      });

      // Keep connection alive for 10-30 seconds
      socket.setTimeout(() => {
        socket.close();
      }, Math.floor(Math.random() * 20000) + 10000);
    });

    check(response, {
      "WebSocket connection successful": (r) => r && r.status === 101,
    });
  });

  // Wait between 3-10 seconds before next action (simulate real user behavior)
  sleep(Math.random() * 7 + 3);

  // Test rate limiting - some users try to send multiple comments quickly
  if (Math.random() < 0.1) {
    // 10% of users
    for (let i = 0; i < 3; i++) {
      const res = http.post(
        `${BASE_URL}/api/comment`,
        JSON.stringify({
          displayName: displayName,
          content: "Spam test " + i,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (res.status === 429) {
        // Too Many Requests
        rateLimitHits.add(1);
      }
      sleep(0.5);
    }
  }
}

export function handleSummary(data) {
  return {
    "summary.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || "";
  let summary = "\n";

  summary += `${indent}✓ Chat Load Test Results\n`;
  summary += `${indent}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  summary += `${indent}Total Virtual Users: ${data.metrics.vus_max.values.max}\n`;
  summary += `${indent}Total Comments Sent: ${
    data.metrics.comment_success_rate
      ? data.metrics.comment_success_rate.values.count
      : 0
  }\n`;
  summary += `${indent}Success Rate: ${(data.metrics.comment_success_rate
    ? data.metrics.comment_success_rate.values.rate * 100
    : 0
  ).toFixed(2)}%\n`;
  summary += `${indent}Avg Comment Duration: ${
    data.metrics.comment_duration
      ? data.metrics.comment_duration.values.avg.toFixed(2)
      : 0
  }ms\n`;
  summary += `${indent}P95 Comment Duration: ${
    data.metrics.comment_duration
      ? data.metrics.comment_duration.values["p(95)"].toFixed(2)
      : 0
  }ms\n`;
  summary += `${indent}Rate Limit Hits: ${
    data.metrics.rate_limit_hits ? data.metrics.rate_limit_hits.values.count : 0
  }\n`;
  summary += `${indent}WS Connection Errors: ${
    data.metrics.ws_connection_errors
      ? data.metrics.ws_connection_errors.values.count
      : 0
  }\n`;

  return summary;
}
