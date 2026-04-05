/**
 * Prisma Database Client Configuration
 * Initializes connection to PostgreSQL database using Prisma adapter
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({ adapter });

// const connectionString = `${process.env.DATABASE_URL}`;
