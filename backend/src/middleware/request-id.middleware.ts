import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

/**
 * Request ID middleware
 * Generates a unique request ID for each incoming request and attaches it to the request object
 * Also sets the X-Request-ID header on the response for client-side tracking
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Generate new request ID or use existing one from header (for distributed tracing)
  const requestId = (req.headers["x-request-id"] as string) || uuidv4();

  // Attach to request object
  req.requestId = requestId;

  // Set response header so client can track the request
  res.setHeader("X-Request-ID", requestId);

  next();
}
