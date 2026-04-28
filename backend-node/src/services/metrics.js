// src/services/metrics.js
const metrics = {
  requests: {
    total: 0,
    byPath: {},
    byStatus: {},
    byMethod: {}
  },
  responses: {
    p50: 0,
    p95: 0,
    p99: 0
  }
};

// Keep last 1000 response times for percentiles
const responseTimes = [];

function recordRequest(path, method, status, durationMs) {
  // Total
  metrics.requests.total += 1;

  // By path
  const pathKey = `${method} ${path}`;
  metrics.requests.byPath[pathKey] = (metrics.requests.byPath[pathKey] || 0) + 1;

  // By status bucket
  const statusBucket = Math.floor(status / 100) * 100;
  metrics.requests.byStatus[statusBucket] = (metrics.requests.byStatus[statusBucket] || 0) + 1;

  // By method
  metrics.requests.byMethod[method] = (metrics.requests.byMethod[method] || 0) + 1;

  // Response time
  responseTimes.push(durationMs);
  if (responseTimes.length > 1000) responseTimes.shift();

  // Recalculate percentiles
  if (responseTimes.length > 0) {
    const sorted = [...responseTimes].sort((a, b) => a - b);
    const p50Idx = Math.floor(sorted.length * 0.5);
    const p95Idx = Math.floor(sorted.length * 0.95);
    const p99Idx = Math.floor(sorted.length * 0.99);
    metrics.responses.p50 = sorted[p50Idx];
    metrics.responses.p95 = sorted[p95Idx];
    metrics.responses.p99 = sorted[p99Idx];
  }
}

function getMetrics() {
  return JSON.parse(JSON.stringify(metrics));
}

function resetMetrics() {
  metrics.requests = { total: 0, byPath: {}, byStatus: {}, byMethod: {} };
  responseTimes.length = 0;
}

module.exports = { recordRequest, getMetrics, resetMetrics };