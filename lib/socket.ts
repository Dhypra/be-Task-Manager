import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import { logger } from "./logger";

let io: Server;

interface SocketUser {
  userId: string;
  role: string;
}

export const initializeSocket = (server: http.Server) => {
  const corsOrigins = (process.env.SOCKET_IO_CORS || process.env.CORS_ORIGIN || "*").split(",");
  
  io = new Server(server, {
    cors: {
      origin: corsOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // Socket.IO middleware untuk autentikasi JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      logger.warn("Socket connection attempt without token", { socketId: socket.id });
      return next(new Error("Authentication required"));
    }

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error("JWT_SECRET not configured");
      }

      const decoded = jwt.verify(token, secret) as SocketUser;
      socket.data.user = decoded;
      logger.debug("Socket authenticated", { socketId: socket.id, userId: decoded.userId });
      next();
    } catch (error) {
      logger.warn("Socket authentication failed", { 
        socketId: socket.id, 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as SocketUser;
    logger.info("User connected via Socket.IO", { 
      socketId: socket.id, 
      userId: user?.userId 
    });

    // Join room berdasarkan userId untuk targeted updates
    if (user?.userId) {
      socket.join(`user:${user.userId}`);
      if (user.role === "ADMIN") {
        socket.join("admin");
      }
    }

    socket.on("disconnect", () => {
      logger.info("User disconnected from Socket.IO", { 
        socketId: socket.id, 
        userId: user?.userId 
      });
    });
  });

  return io;
};

export { io };