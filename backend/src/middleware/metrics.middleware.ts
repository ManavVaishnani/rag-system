import { Request, Response, NextFunction } from "express";
import { metrics } from "../services/metrics.service";
import { getParameterizedRoute } from "../config/metrics";

/**
 * Express middleware to collect HTTP request metrics
 * Tracks request duration, count, and status codes
 */
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  // Store original end function
  const originalEnd = res.end;

  // Override end function to capture metrics
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.end = function (
    this: Response,
    chunk?: any,
    encoding?: any,
    cb?: any,
  ): Response {
    // Calculate duration
    const duration = Date.now() - start;

    // Get route (use route path if available, otherwise use request path)
    const route = req.route?.path
      ? getParameterizedRoute(req.route.path)
      : getParameterizedRoute(req.path);

    // Record metrics
    metrics.observeHttpRequest(req.method, route, res.statusCode, duration);

    // Call original end function
    if (typeof encoding === "function") {
      // Signature: res.end(chunk?, callback?)
      return originalEnd.call(this, chunk, encoding);
    } else {
      // Signature: res.end(chunk?, encoding?, callback?)
      return originalEnd.call(this, chunk, encoding, cb);
    }
  };

  next();
}
