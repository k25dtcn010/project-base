import { auth } from "@project-base/auth";

import prisma from "../src/index";

async function main() {
  console.log("🌱 Seeding database...");

  // Check if admin user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
  });

  if (existingUser) {
    console.log("✅ Admin user already exists");
    return;
  }

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
