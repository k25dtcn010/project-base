import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "csv-parse/sync";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { DAYS_OFF } from "../../src/constants/work-schedule";
import { db } from "../../src/index";
import { analyzeAttendance } from "../../src/services/shift-analyzer";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

interface AttendanceRecord {
  employeeCode: string;
  employeeName: string;
  date: string; // Format: M/D/YYYY
  checkInTime?: string; // Format: HH:mm
  checkOutTime?: string; // Format: HH:mm
  lateMinutes: number;
  earlyLeaveMinutes: number;
  shiftCode: string; // e.g., "HC" for hành chính
  isAbsent: boolean;
}

/**
 * Parse attendance CSV file (T11.csv format)
 */
function parseAttendanceCsv(filePath: string): AttendanceRecord[] {
  const fileContent = readFileSync(filePath, "utf-8");
  const content = fileContent.replace(/^\uFEFF/, ""); // Remove BOM

  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  return records.map((record: any) => {
    const checkInTime = record["Giờ vào"]?.trim() || "";
    const checkOutTime = record["Giờ ra"]?.trim() || "";
    const isAbsent = !checkInTime && !checkOutTime;

    return {
      employeeCode: record["Mã nhân viên"]?.trim() || "",
      employeeName: record["Tên nhân viên"]?.trim() || "",
      date: record["Ngày"]?.trim() || "",
      checkInTime: checkInTime || undefined,
      checkOutTime: checkOutTime || undefined,
      lateMinutes: parseInt(record["Trễ"] || "0", 10),
      earlyLeaveMinutes: parseInt(record["Sớm"] || "0", 10),
      shiftCode: record["Ca"]?.trim() || "HC",
      isAbsent,
    };
  });
}

/**
 * Seed attendance data from T11.csv
 */
export async function seedAttendances() {
  console.log("🔄 Seeding attendances from T11.csv...");
  console.log(
    `📅 Work schedule: Nghỉ Chủ nhật, làm việc Thứ 2-7 (days off: ${DAYS_OFF.join(", ")})`,
  );

  // Check if attendance data already exists
  const existingAttendanceCount = await db.attendance.count();
  if (existingAttendanceCount > 0) {
    console.log(`⚠️  Found ${existingAttendanceCount} existing attendance records.`);
    console.log("🗑️  Deleting existing attendance data to prevent duplicates...");

    // Delete in correct order due to foreign key constraints
    await db.attendanceShift.deleteMany({});
    await db.attendance.deleteMany({});

    console.log("✅ Existing attendance data deleted.");
  }

  // Read and parse T11.csv
  const csvPath = join(__dirname, "T11.csv");
  let attendanceRecords: AttendanceRecord[];

  try {
    attendanceRecords = parseAttendanceCsv(csvPath);
    console.log(`📄 Parsed ${attendanceRecords.length} attendance records from CSV`);
  } catch (error) {
    console.error("❌ Error reading T11.csv:", error);
    return;
  }

  // Get all employees and shifts
  const employees = await db.employee.findMany();
  const shifts = await db.shift.findMany();

  if (employees.length === 0) {
    console.log("❌ No employees found. Please seed employees first.");
    return;
  }

  if (shifts.length === 0) {
    console.log("❌ No shifts found. Please seed shifts first.");
    return;
  }

  // Create employee code to ID map
  const employeeMap = new Map(employees.map((e) => [e.employeeCode, e.id]));

  let totalCreated = 0;
  let skippedAbsent = 0;
  let skippedNoEmployee = 0;
  let skippedInvalidDate = 0;

  // Group records by employee and date
  const groupedRecords = new Map<string, AttendanceRecord[]>();
  for (const record of attendanceRecords) {
    const key = `${record.employeeCode}_${record.date}`;
    if (!groupedRecords.has(key)) {
      groupedRecords.set(key, []);
    }
    groupedRecords.get(key)!.push(record);
  }

  console.log(`\n📊 Processing ${groupedRecords.size} unique employee-day combinations...`);

  // Process each unique employee-day combination
  for (const [, dayRecords] of groupedRecords.entries()) {
    const firstRecord = dayRecords[0];
    if (!firstRecord) continue;

    // Skip absent records (marked with "V" - nghỉ)
    if (firstRecord.isAbsent || firstRecord.shiftCode === "V") {
      skippedAbsent++;
      continue;
    }

    // Get employee ID
    const employeeId = employeeMap.get(firstRecord.employeeCode);
    if (!employeeId) {
      console.log(`⚠️  Employee not found: ${firstRecord.employeeCode}`);
      skippedNoEmployee++;
      continue;
    }

    // Parse date (format: M/D/YYYY or MM/DD/YYYY)
    const dateParts = firstRecord.date?.split("/");
    if (dateParts.length !== 3) {
      console.log(`⚠️  Invalid date format: ${firstRecord.date}`);
      skippedInvalidDate++;
      continue;
    }

    const month = parseInt(dateParts[0] ?? "0", 10);
    const day = parseInt(dateParts[1] ?? "0", 10);
    const year = parseInt(dateParts[2] ?? "0", 10);
    const workDate = dayjs.tz(`${year}-${month}-${day}`, "Asia/Ho_Chi_Minh");

    if (!workDate.isValid()) {
      console.log(`⚠️  Invalid date: ${firstRecord.date}`);
      skippedInvalidDate++;
      continue;
    }

    // Determine overall check-in and check-out times
    let earliestCheckIn: dayjs.Dayjs | null = null;
    let latestCheckOut: dayjs.Dayjs | null = null;

    // Process all records for this day (might be multiple shifts)
    for (const record of dayRecords) {
      if (record.checkInTime) {
        const [hour, minute] = record.checkInTime.split(":").map(Number);
        const checkIn = workDate
          .hour(hour ?? 0)
          .minute(minute ?? 0)
          .second(0);
        if (!earliestCheckIn || checkIn.isBefore(earliestCheckIn)) {
          earliestCheckIn = checkIn;
        }
      }

      if (record.checkOutTime) {
        const [hour, minute] = record.checkOutTime.split(":").map(Number);
        let checkOut = workDate
          .hour(hour ?? 0)
          .minute(minute ?? 0)
          .second(0);

        // If checkout is before checkin, it's next day
        if (earliestCheckIn && checkOut.isBefore(earliestCheckIn)) {
          checkOut = checkOut.add(1, "day");
        }

        if (!latestCheckOut || checkOut.isAfter(latestCheckOut)) {
          latestCheckOut = checkOut;
        }
      }
    }

    // Skip if no check-in time
    if (!earliestCheckIn) {
      skippedInvalidDate++;
      continue;
    }

    // Create attendance record
    const attendance = await db.attendance.create({
      data: {
        employeeId,
        checkInTime: earliestCheckIn.toDate(),
        checkOutTime: latestCheckOut?.toDate() || null,
        location: "Office",
        isMissingCheckOut: !latestCheckOut,
        note:
          dayRecords.length > 1
            ? `Multiple shifts: ${dayRecords.map((r) => r.shiftCode).join(", ")}`
            : undefined,
      },
    });

    // Use analyzeAttendance to automatically detect all overlapping shifts
    // This ensures consistent behavior between seeded data and production data
    if (latestCheckOut) {
      try {
        await analyzeAttendance(attendance.id);
        totalCreated++;
      } catch (error) {
        console.error(
          `❌ Error analyzing attendance for ${firstRecord.employeeCode} on ${workDate.format("YYYY-MM-DD")}:`,
          error,
        );
      }
    } else {
      // Skip analysis if no check-out time
      totalCreated++;
    }
  }

  console.log("\n✅ Attendance seeding completed!");
  console.log(`   📊 Total attendance records created: ${totalCreated}`);
  console.log(`   ⏭️  Skipped absent records: ${skippedAbsent}`);
  console.log(`   ⚠️  Skipped (employee not found): ${skippedNoEmployee}`);
  console.log(`   ⚠️  Skipped (invalid date): ${skippedInvalidDate}`);
  console.log(`   ℹ️  Shift detection: Auto-analyzed via analyzeAttendance()`);
}
