import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";
import type { AuthedRequest } from "./requireAuth";

// Sets req.userId when a valid token is present; never rejects the request.
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const payload = verifyToken(header.slice(7));
    if (payload) (req as AuthedRequest).userId = payload.userId;
  }
  next();
}
