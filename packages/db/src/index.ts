import { PrismaClient } from "../prisma/generated/client";

const prisma = new PrismaClient();

export const db = prisma;
export default prisma;
