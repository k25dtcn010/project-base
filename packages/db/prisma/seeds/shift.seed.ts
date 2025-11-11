import { db } from "../../src/index";

export async function seedShifts() {
  console.log("🔄 Seeding shifts...");

  const shifts = [
    {
      name: "Hành chính",
      startTime: "08:00",
      endTime: "17:00",
      description: "Ca hành chính (8h sáng đến 5h chiều)",
      isActive: true,
    },
    {
      name: "Tối",
      startTime: "17:00",
      endTime: "00:00",
      description: "Ca tối (5h chiều đến 12h đêm)",
      isActive: true,
    },
    {
      name: "Đêm",
      startTime: "00:00",
      endTime: "06:00",
      description: "Ca đêm (12h đêm đến 6h sáng)",
      isActive: true,
    },
    {
      name: "Sáng",
      startTime: "06:00",
      endTime: "08:00",
      description: "Ca sáng (6h sáng đến 8h sáng)",
      isActive: true,
    },
  ];

  for (const shift of shifts) {
    const existing = await db.shift.findFirst({
      where: { name: shift.name, startTime: shift.startTime },
    });

    if (!existing) {
      await db.shift.create({ data: shift });
      console.log(`✅ Created shift: ${shift.name}`);
    } else {
      console.log(`⏭️  Shift already exists: ${shift.name}`);
    }
  }

  console.log("✅ Shift seeding completed!");
}
