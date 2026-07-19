import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";

export interface AdminRequest extends Request {
  adminEmail?: string;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const payload = verifyToken(header.slice(7));
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  if (!payload.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  (req as AdminRequest).adminEmail = payload.email;
  next();
}
