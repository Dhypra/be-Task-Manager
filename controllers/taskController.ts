/**
 * Task Controller
 * Handles task management and admin operations.
 */

import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { Status } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { io } from "../lib/socket";

type AuthRequest = Request & {
  user: {
    userId: string;
    role: string;
  };
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 6;
const DEFAULT_STATUS: Status = "ON_SCHEDULE";

const parseInteger = (value: unknown, fallback: number): number => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
};

const parseStatus = (value: unknown): Status | undefined => {
  const candidate = String(value ?? "").trim();
  if (
    candidate === "ON_SCHEDULE" ||
    candidate === "COMPLETED" ||
    candidate === "OVERDUE"
  ) {
    return candidate as Status;
  }
  return undefined;
};

const parseDeadline = (value: unknown): Date | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const date = new Date(String(value));
  return Number.isNaN(date.valueOf()) ? undefined : date;
};

const errorResponse = (
  res: Response,
  error: unknown,
  message = "Server error",
  status = 500,
): Response => {
  return res.status(status).json({
    message: error instanceof Error ? error.message : message,
  });
};

const buildTaskFilter = (
  user: AuthRequest["user"],
  search: unknown,
  status: unknown,
): Prisma.TaskWhereInput => {
  const queryStatus = parseStatus(status);
  const baseFilter: Prisma.TaskWhereInput = {
    title: {
      contains: String(search ?? ""),
      mode: "insensitive",
    },
    ...(queryStatus ? { status: queryStatus } : {}),
  };

  return user.role === "ADMIN"
    ? baseFilter
    : { ...baseFilter, userId: user.userId };
};

export const getUsers = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(200).json(users);
  } catch (error) {
    return errorResponse(res, error, "Error fetching users");
  }
};

export const getAllTasks = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const tasks = await prisma.task.findMany();
    return res.status(200).json(tasks);
  } catch (error) {
    return errorResponse(res, error, "Error fetching tasks");
  }
};

export const getStats = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { role, userId } = req.user;
    const where: Prisma.TaskWhereInput = role === "ADMIN" ? {} : { userId };

    const total = await prisma.task.count({ where });
    const completed = await prisma.task.count({
      where: { ...where, status: "COMPLETED" },
    });
    const pending = await prisma.task.count({
      where: { ...where, status: "ON_SCHEDULE" },
    });

    return res.status(200).json({ total, completed, pending });
  } catch (error) {
    return errorResponse(res, error, "Error fetching stats");
  }
};

export const getTasks = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  const {
    search = "",
    page = "1",
    limit = "6",
    status,
  } = req.query as {
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
  };

  try {
    const pageNumber = parseInteger(page, DEFAULT_PAGE);
    const take = parseInteger(limit, DEFAULT_LIMIT);
    const where = buildTaskFilter(req.user, search, status);

    const total = await prisma.task.count({ where });
    const tasks = await prisma.task.findMany({
      where,
      skip: (pageNumber - 1) * take,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return res.status(200).json({
      data: tasks,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / take),
    });
  } catch (error) {
    return errorResponse(res, error, "Error fetching tasks");
  }
};

export const getDetailTask = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (req.user.role !== "ADMIN" && task.userId !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    return res.status(200).json({ task });
  } catch (error) {
    return errorResponse(res, error, "Error fetching task");
  }
};

export const createTask = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { title, description, deadline, status } = req.body;

    if (!title || !description || deadline === undefined || deadline === null) {
      return res
        .status(400)
        .json({ message: "Title, description, and deadline are required" });
    }

    const parsedDeadline = parseDeadline(deadline);
    if (!parsedDeadline) {
      return res.status(400).json({ message: "Invalid deadline format" });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        deadline: parsedDeadline,
        status: parseStatus(status) ?? DEFAULT_STATUS,
        user: { connect: { id: req.user.userId } },
      },
    });

    io.emit("task:created", task);
    return res.status(201).json(task);
  } catch (error) {
    return errorResponse(res, error, "Error creating task");
  }
};

export const updateTask = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { title, description, deadline, status } = req.body;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (req.user.role !== "ADMIN" && task.userId !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only update your own tasks" });
    }

    const updates: Prisma.TaskUpdateInput = {};
    if (title) updates.title = title;
    if (description) updates.description = description;

    if (status !== undefined) {
      const parsedStatus = parseStatus(status);
      if (!parsedStatus) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      updates.status = parsedStatus;
    }

    if (deadline !== undefined) {
      const parsedDeadline = parseDeadline(deadline);
      if (!parsedDeadline) {
        return res.status(400).json({ message: "Invalid deadline format" });
      }
      updates.deadline = parsedDeadline;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "No fields provided for update" });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updates,
    });
    io.emit("task:updated", updatedTask);
    return res.status(200).json(updatedTask);
  } catch (error) {
    return errorResponse(res, error, "Error updating task");
  }
};

export const deleteTask = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (req.user.role !== "ADMIN" && task.userId !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only delete your own tasks" });
    }

    await prisma.task.delete({ where: { id } });
    io.emit("taskDeleted", { id });
    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    return errorResponse(res, error, "Error deleting task");
  }
};
