/**
 * Metrics configuration and route parameterization patterns
 */

export const METRICS_CONFIG = {
  enabled: process.env.METRICS_ENABLED !== "false",
  port: parseInt(process.env.METRICS_PORT || "9090", 10),

  // Histogram buckets for request durations (in seconds)
  httpBuckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30],

  // External API timeout buckets
  apiBuckets: [0.1, 0.5, 1, 2, 5, 10, 15, 30],
};

// Route parameterization patterns to prevent high cardinality
export const ROUTE_PATTERNS: Array<{
  pattern: RegExp;
  replacement: string;
}> = [
  {
    pattern: /^\/api\/documents\/[\w-]+$/,
    replacement: "/api/documents/:id",
  },
  {
    pattern: /^\/api\/documents\/[\w-]+\/status$/,
    replacement: "/api/documents/:id/status",
  },
  {
    pattern: /^\/api\/conversations\/[\w-]+$/,
    replacement: "/api/conversations/:id",
  },
  {
    pattern: /^\/api\/vectors\/document\/[\w-]+$/,
    replacement: "/api/vectors/document/:documentId",
  },
  {
    pattern: /^\/api\/vectors\/user\/[\w-]+$/,
    replacement: "/api/vectors/user/:userId",
  },
  {
    pattern: /^\/health\/.*$/,
    replacement: "/health/:probe",
  },
];

/**
 * Convert a request path to a parameterized route for metrics
 * Prevents high cardinality by replacing IDs with placeholders
 */
export function getParameterizedRoute(path: string): string {
  for (const { pattern, replacement } of ROUTE_PATTERNS) {
    if (pattern.test(path)) {
      return replacement;
    }
  }
  return path;
}
