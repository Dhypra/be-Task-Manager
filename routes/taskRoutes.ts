/**
 * Task Routes
 * Handles task CRUD operations and admin tasks.
 */

import express from "express";
import {
  getUsers,
  getStats,
  getAllTasks,
  getTasks,
  
  createTask,
  updateTask,
  deleteTask,
  getDetailTask,
} from "../controllers/taskController.js";
import { exportTasksPDF } from "../controllers/pdfController.js";
import { isAdmin, verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/users", verifyToken, isAdmin, getUsers);
router.get("/tasks/all", verifyToken, isAdmin, getAllTasks);
router.get("/stats", verifyToken, getStats);
router.get("/tasks", verifyToken, getTasks);
router.get("/tasks/:id", verifyToken, getDetailTask);
router.get("/tasks/export/pdf", verifyToken, exportTasksPDF);
router.post("/tasks", verifyToken, createTask);
router.put("/tasks/:id", verifyToken, updateTask);
router.delete("/tasks/:id", verifyToken, deleteTask);

export default router;
