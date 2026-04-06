/**
 * Authentication Controller
 * Handles user registration and login operations.
 */

import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

const errorResponse = (
  res: Response,
  error: unknown,
  message = "Server error",
  status = 500
): Response => {
  return res.status(status).json({
    message: error instanceof Error ? error.message : message,
  });
};

export const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const { password: _, ...safeUser } = user;
    return res.status(201).json({ message: "User created successfully", user: safeUser });
  } catch (error) {
    return errorResponse(res, error, "Registration failed");
  }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: "24h" });
    return res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    return errorResponse(res, error, "Server error during login");
  }
};
