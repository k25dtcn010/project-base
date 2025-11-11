import { auth } from "@project-base/auth";

import prisma from "../src/index";
import { seedAttendances } from "./seeds/attendance.seed";
import { seedEmployeeData } from "./seeds/employee.seed";
import { seedShifts } from "./seeds/shift.seed";

async function main() {
  console.log("🌱 Seeding database...");

  // Check if admin user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
  });

  if (existingUser) {
    console.log("✅ Admin user already exists");
  } else {
    // Create admin user using better-auth API
    try {
      const data = await auth.api.signUpEmail({
        body: {
          name: "Admin",
          email: "admin@example.com",
          password: "changethis",
        },
      });

      console.log("✅ Admin user created successfully:", data);
    } catch (error) {
      console.error("❌ Error creating admin user:", error);
      throw error;
    }
  }

  // Seed shifts
  await seedShifts();

  // Seed employee data
  await seedEmployeeData();

  // Seed attendance data with various edge cases
  await seedAttendances();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("🎉 Seeding completed!");
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
