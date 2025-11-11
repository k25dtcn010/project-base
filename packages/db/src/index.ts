import { PrismaClient } from "../prisma/generated/client";

const prisma = new PrismaClient();

export const db = prisma;
export default prisma;

// Export work schedule constants and utilities
export * from "./constants/work-schedule";
