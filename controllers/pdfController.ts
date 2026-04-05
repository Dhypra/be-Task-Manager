/**
 * PDF Controller
 * Handles PDF export operations for tasks.
 */

import PDFDocument from "pdfkit";
import type { Response } from "express";
import { prisma } from "../lib/prisma";

type AuthRequest = {
  user: {
    userId: string;
    role: string;
  };
};

const errorResponse = (
  res: Response,
  error: unknown,
  message = "Server error",
  status = 500,
): void => {
  res.status(status).json({
    message: error instanceof Error ? error.message : message,
  });
};

export const exportTasksPDF = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const where = req.user.role === "ADMIN" ? {} : { userId: req.user.userId };
    const tasks = await prisma.task.findMany({
      where,
      include: { user: { select: { name: true } } },
    });

    if (!tasks.length) {
      res.status(404).json({ message: "No tasks found to export" });
      return;
    }

    const doc = new PDFDocument({ margin: 30 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=tasks.pdf");

    doc.pipe(res);

    // Title
    doc.fontSize(18).text("Task List Report", { align: "center" });
    doc.moveDown(2);

    // Table setup
    const tableTop = 100;
    const rowHeight = 25;
    const isAdmin = req.user.role === "ADMIN";
    const colWidths = isAdmin
      ? [30, 100, 80, 120, 70, 80] // No, Title, User, Description, Deadline, Status
      : [30, 120, 150, 80, 100]; // No, Title, Description, Deadline, Status
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const startX = (doc.page.width - tableWidth) / 2;

    // Header
    const headers = isAdmin
      ? ["No", "Title", "User", "Description", "Deadline", "Status"]
      : ["No", "Title", "Description", "Deadline", "Status"];
    doc.fontSize(12).font("Helvetica-Bold");

    let currentY = tableTop;
    let currentX = startX;

    headers.forEach((header, index) => {
      doc.rect(currentX, currentY, colWidths[index], rowHeight).stroke();
      doc.text(header, currentX + 5, currentY + 5, {
        width: colWidths[index] - 10,
        height: rowHeight - 10,
        align: "center",
      });
      currentX += colWidths[index];
    });

    currentY += rowHeight;

    // Data rows
    doc.font("Helvetica").fontSize(10);

    tasks.forEach((task: any, index: number) => {
      currentX = startX;

      const deadlineFormatted = task.deadline
        ? new Date(task.deadline).toLocaleDateString("id-ID")
        : "N/A";

      const rowData = isAdmin
        ? [
            (index + 1).toString(),
            task.title,
            task.user?.name || "N/A",
            task.description || "N/A",
            deadlineFormatted,
            task.status,
          ]
        : [
            (index + 1).toString(),
            task.title,
            task.description || "N/A",
            deadlineFormatted,
            task.status,
          ];

      rowData.forEach((data, colIndex) => {
        doc.rect(currentX, currentY, colWidths[colIndex], rowHeight).stroke();
        doc.text(data, currentX + 5, currentY + 5, {
          width: colWidths[colIndex] - 10,
          height: rowHeight - 10,
        });
        currentX += colWidths[colIndex];
      });

      currentY += rowHeight;

      // New page if needed
      if (currentY > doc.page.height - 50) {
        doc.addPage();
        currentY = 50;
      }
    });

    // Footer
    doc
      .fontSize(8)
      .text(
        `Generated on ${new Date().toLocaleDateString()}`,
        50,
        doc.page.height - 30,
      );

    doc.end();
  } catch (error) {
    errorResponse(res, error, "Error generating PDF");
  }
};
