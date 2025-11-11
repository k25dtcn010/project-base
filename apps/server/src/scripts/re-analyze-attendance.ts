import { analyzeAttendance, db } from "@project-base/db";

/**
 * Re-analyze all attendance records to regenerate shift segments
 */
async function reAnalyzeAllAttendance() {
  console.log("🔄 Starting re-analysis of all attendance records...\n");

  try {
    // Get all attendance records with check-out time
    const attendances = await db.attendance.findMany({
      where: {
        checkOutTime: { not: null },
      },
      include: {
        employee: {
          select: {
            employeeCode: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        checkInTime: "asc",
      },
    });

    console.log(`📊 Found ${attendances.length} attendance records to analyze\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const attendance of attendances) {
      try {
        console.log(`\n${"=".repeat(80)}`);
        console.log(
          `👤 Employee: ${attendance.employee?.fullName} (${attendance.employee?.employeeCode})`,
        );
        console.log(`📅 Attendance ID: ${attendance.id}`);

        await analyzeAttendance(attendance.id);

        successCount++;
      } catch (error) {
        console.error(`❌ Error analyzing attendance ${attendance.id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n${"=".repeat(80)}`);
    console.log(`\n✅ Re-analysis completed!`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total: ${attendances.length}`);
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  reAnalyzeAllAttendance()
    .then(() => {
      console.log("\n🎉 Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Fatal error:", error);
      process.exit(1);
    });
}

export { reAnalyzeAllAttendance };
