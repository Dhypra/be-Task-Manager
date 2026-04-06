/**
 * Authentication Middleware
 * Provides JWT verification and role-based access control.
 */

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../lib/logger.js";

type AuthRequest = Request & {
  user?: {
    userId: string;
    role: string;
  };
};

const getClientIP = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  const socket = (req as any).socket;
  return (socket?.remoteAddress as string) || "unknown";
};

const unauthorized = (res: Response, message: string, data?: Record<string, unknown>): Response => {
  if (data) {
    logger.warn("Unauthorized request", data);
  }
  return res.status(401).json({ message });
};

const forbidden = (res: Response, message: string, data?: Record<string, unknown>): Response => {
  if (data) {
    logger.warn("Forbidden request", data);
  }
  return res.status(403).json({ message });
};

export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  const authHeader = req.headers.authorization;
  const clientIP = getClientIP(req);

  if (!authHeader) {
    return unauthorized(res, "No token provided", { ip: clientIP });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return unauthorized(res, "Invalid authorization header", { ip: clientIP });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return forbidden(res, "Server token configuration missing");
  }

  try {
    const decoded = jwt.verify(token, secret);
    if (!decoded || typeof decoded !== "object") {
      return forbidden(res, "Invalid token payload", { ip: clientIP });
    }

    req.user = decoded as { userId: string; role: string };
    logger.debug("Token verified successfully", { userId: req.user.userId, role: req.user.role });
    return next();
  } catch (error) {
    logger.warn("Token verification failed", { 
      error: error instanceof Error ? error.message : "Unknown error",
      ip: clientIP 
    });
    return forbidden(res, "Invalid or expired token", { ip: clientIP });
  }
};

export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  if (req.user?.role !== "ADMIN") {
    const clientIP = getClientIP(req);
    logger.warn("Admin access denied", { 
      userId: req.user?.userId, 
      role: req.user?.role,
      ip: clientIP 
    });
    return forbidden(res, "Access denied: admin role required", { userId: req.user?.userId });
  }
  return next();
};
