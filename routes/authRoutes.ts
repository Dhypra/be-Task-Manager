/**
 * Authentication Routes
 * Handles user registration and login endpoints
 */

import express from "express";
import { register, login } from "../controllers/authController";

const router = express.Router();

// POST /api/auth/register - Create new user account
router.post("/register", register);

// POST /api/auth/login - Authenticate user and get JWT token
router.post("/login", login);

export default router;