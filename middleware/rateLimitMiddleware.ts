/**
 * Rate Limiting Middleware
 * Prevents brute-force attacks and API abuse
 */

import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

interface RateLimitStore {
  [key: string]: { count: number; resetsAt: number };
}

const store: RateLimitStore = {};
const LIMIT = 100; // requests
const WINDOW = 15 * 60 * 1000; // 15 minutes

const getClientIP = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  const socket = (req as any).socket;
  return (socket?.remoteAddress as string) || "unknown";
};

const cleanupStore = (): void => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetsAt < now) {
      delete store[key];
    }
  });
};

export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  cleanupStore();

  const identifier = getClientIP(req);
  const now = Date.now();

  if (!store[identifier]) {
    store[identifier] = { count: 1, resetsAt: now + WINDOW };
    next();
    return;
  }

  if (store[identifier].resetsAt < now) {
    store[identifier] = { count: 1, resetsAt: now + WINDOW };
    next();
    return;
  }

  store[identifier].count++;

  if (store[identifier].count > LIMIT) {
    logger.warn("Rate limit exceeded", { ip: identifier, count: store[identifier].count });
    res.status(429).json({ message: "Too many requests, please try again later" });
    return;
  }

  res.setHeader("X-RateLimit-Limit", LIMIT.toString());
  res.setHeader("X-RateLimit-Remaining", (LIMIT - store[identifier].count).toString());
  res.setHeader("X-RateLimit-Reset", store[identifier].resetsAt.toString());

  next();
};
