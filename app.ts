/**
 * Main Express Server Entry Point
 * Initializes the REST API server with middleware, routes, and database connections.
 */

import express, { type Request, type Response } from "express";
import cors from "cors";
import http from "http";
import { validateEnv } from "./lib/env";
import { logger } from "./lib/logger";
import { initializeSocket } from "./lib/socket";
import { rateLimitMiddleware } from "./middleware/rateLimitMiddleware";
import { prisma } from "./lib/prisma";
import router from "./routes/taskRoutes";
import authRoutes from "./routes/authRoutes";

// Validate environment variables at startup
validateEnv();

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure CORS
const corsOrigins = (process.env.CORS_ORIGIN || "*").split(",");
const corsOptions = {
  origin: corsOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Initialize Socket.IO
const io = initializeSocket(server);

// Configure middleware
app.use(express.json({ limit: "10mb" }));
app.use(cors(corsOptions));
app.use(rateLimitMiddleware);

// Configure routes
app.use("/api/auth", authRoutes);
app.use("/api", router);

// Health check endpoint
app.get("/", (_req: Request, res: Response) => {
  res.send("Hello world");
});

// Export io for use in controllers
export { io };

// Start server
const PORT = Number(process.env.PORT || 5000);
const NODE_ENV = process.env.NODE_ENV || "development";

server.listen(PORT, "0.0.0.0", () => {
  logger.info("Server started successfully", {
    port: PORT,
    environment: NODE_ENV,
    corsOrigins: corsOrigins.join(", "),
  });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("Server shut down successfully");
    process.exit(0);
  });
});
