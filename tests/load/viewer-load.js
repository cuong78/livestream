/**
 * k6 Load Test: Viewer Concurrent Streaming
 *
 * Test scenario: Simulate multiple concurrent viewers watching HLS stream
 *
 * Run: k6 run viewer-load.js
 * Run stress test: k6 run --vus 500 --duration 10m viewer-load.js
 */

import { check, group, sleep } from "k6";
import http from "k6/http";
import { Rate, Trend, Counter } from "k6/metrics";

// Custom metrics
const streamLoadSuccessRate = new Rate("stream_load_success_rate");
const streamLoadDuration = new Trend("stream_load_duration");
const hlsSegmentErrors = new Counter("hls_segment_errors");
const viewerCountAccuracy = new Counter("viewer_count_accuracy");

// Test configuration - Simulating 500-1000 concurrent viewers
export const options = {
  stages: [
    { duration: "1m", target: 100 }, // Warm up: 100 viewers
    { duration: "2m", target: 300 }, // Ramp up: 300 viewers
    { duration: "3m", target: 500 }, // Peak load: 500 viewers
    { duration: "2m", target: 800 }, // Stress test: 800 viewers
    { duration: "1m", target: 1000 }, // Max load: 1000 viewers
    { duration: "2m", target: 500 }, // Scale down
    { duration: "1m", target: 0 }, // Ramp down
  ],
  thresholds: {
    stream_load_success_rate: ["rate>0.98"], // 98% success rate
    stream_load_duration: ["p(95)<3000"], // 95% loads under 3s
    http_req_duration: ["p(99)<5000"], // 99% under 5s
    http_req_failed: ["rate<0.02"], // Less than 2% failed requests
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const API_URL = __ENV.API_URL || "http://localhost:8080/api";
const HLS_URL = __ENV.HLS_URL || "http://localhost:8081/live";

export default function () {
  const viewerId = `viewer_${__VU}_${__ITER}`;

  group("Viewer Access Flow", () => {
    // Step 1: Load homepage
    group("Load Homepage", () => {
      const start = Date.now();
      const res = http.get(BASE_URL);
      const duration = Date.now() - start;

      check(res, {
        "Homepage loaded": (r) => r.status === 200,
        "Homepage contains video player": (r) =>
          r.body.includes("video") || r.body.includes("player"),
      });

      streamLoadDuration.add(duration);
      streamLoadSuccessRate.add(res.status === 200);
    });

    // Step 2: Check for active stream
    group("Check Active Stream", () => {
      const res = http.get(`${API_URL}/stream/current`);

      const streamAvailable = check(res, {
        "Stream API responds": (r) => r.status === 200 || r.status === 204,
      });

      if (res.status === 200 && res.body) {
        const stream = JSON.parse(res.body);

        // Step 3: If stream is live, fetch HLS manifest
        if (stream.status === "LIVE" && stream.hlsUrl) {
          group("Load HLS Stream", () => {
            const hlsRes = http.get(stream.hlsUrl);

            check(hlsRes, {
              "HLS manifest loaded": (r) => r.status === 200,
              "HLS manifest valid": (r) => r.body.includes("#EXTM3U"),
            });

            if (hlsRes.status === 200 && hlsRes.body.includes("#EXTM3U")) {
              // Parse manifest and load first segment
              const lines = hlsRes.body.split("\n");
              const segmentFile = lines.find((line) => line.endsWith(".ts"));

              if (segmentFile) {
                const baseUrl = stream.hlsUrl.substring(
                  0,
                  stream.hlsUrl.lastIndexOf("/")
                );
                const segmentUrl = `${baseUrl}/${segmentFile}`;

                const segmentRes = http.get(segmentUrl);
                check(segmentRes, {
                  "HLS segment loaded": (r) => r.status === 200,
                  "HLS segment is video": (r) =>
                    r.headers["Content-Type"]?.includes("video") ||
                    r.body.length > 1000,
                });

                if (segmentRes.status !== 200) {
                  hlsSegmentErrors.add(1);
                }
              }
            } else {
              hlsSegmentErrors.add(1);
            }
          });
        }
      }
    });

    // Step 4: Load static assets (simulate real browser behavior)
    group("Load Assets", () => {
      http.batch([
        ["GET", `${BASE_URL}/assets/index.css`],
        ["GET", `${BASE_URL}/assets/index.js`],
      ]);
    });
  });

  // Simulate viewer watching for 30-60 seconds
  const watchDuration = Math.floor(Math.random() * 30) + 30;
  sleep(watchDuration);

  // Some viewers refresh the page
  if (Math.random() < 0.1) {
    // 10% refresh rate
    http.get(BASE_URL);
    sleep(2);
  }
}

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    test_duration: data.state.testRunDurationMs / 1000,
    total_requests: data.metrics.http_reqs.values.count,
    failed_requests: data.metrics.http_req_failed.values.count,
    success_rate:
      ((1 - data.metrics.http_req_failed.values.rate) * 100).toFixed(2) + "%",
    avg_response_time:
      data.metrics.http_req_duration.values.avg.toFixed(2) + "ms",
    p95_response_time:
      data.metrics.http_req_duration.values["p(95)"].toFixed(2) + "ms",
    p99_response_time:
      data.metrics.http_req_duration.values["p(99)"].toFixed(2) + "ms",
    max_concurrent_viewers: data.metrics.vus_max.values.max,
    stream_load_success_rate: data.metrics.stream_load_success_rate
      ? (data.metrics.stream_load_success_rate.values.rate * 100).toFixed(2) +
        "%"
      : "N/A",
    hls_segment_errors: data.metrics.hls_segment_errors?.values.count || 0,
  };

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║         VIEWER LOAD TEST RESULTS                        ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(
    `║ Max Concurrent Viewers: ${summary.max_concurrent_viewers
      .toString()
      .padEnd(31)} ║`
  );
  console.log(
    `║ Total Requests: ${summary.total_requests.toString().padEnd(39)} ║`
  );
  console.log(`║ Success Rate: ${summary.success_rate.padEnd(41)} ║`);
  console.log(`║ Avg Response Time: ${summary.avg_response_time.padEnd(36)} ║`);
  console.log(`║ P95 Response Time: ${summary.p95_response_time.padEnd(36)} ║`);
  console.log(`║ P99 Response Time: ${summary.p99_response_time.padEnd(36)} ║`);
  console.log(
    `║ Stream Load Success: ${summary.stream_load_success_rate.padEnd(34)} ║`
  );
  console.log(
    `║ HLS Segment Errors: ${summary.hls_segment_errors
      .toString()
      .padEnd(35)} ║`
  );
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  return {
    "viewer-load-summary.json": JSON.stringify(summary, null, 2),
    "viewer-load-full.json": JSON.stringify(data, null, 2),
  };
}
