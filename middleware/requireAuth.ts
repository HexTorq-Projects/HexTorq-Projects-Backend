import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";

// Requests that have passed through requireAuth / optionalAuth carry the userId.
export interface AuthedRequest extends Request {
  userId?: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const payload = verifyToken(header.slice(7));
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  (req as AuthedRequest).userId = payload.userId;
  next();
}
