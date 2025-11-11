import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { join } from "path";

import { db } from "../../src/index";
import { DAYS_OFF, isDayOff } from "../../src/constants/work-schedule";

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
 * Map shift code to shift name
 */
function getShiftName(shiftCode: string): string {
  const shiftMap: Record<string, string> = {
    HC: "Hành chính", // Administrative/Office shift
    S: "Sáng", // Morning
    T: "Tối", // Evening
    D: "Đêm", // Night
    V: "Nghỉ", // Day off (not a real shift)
  };

  return shiftMap[shiftCode] || "Hành chính";
}

/**
 * Seed attendance data from T11.csv
 */
export async function seedAttendances() {
  console.log("🔄 Seeding attendances from T11.csv...");
  console.log(`📅 Work schedule: Nghỉ Chủ nhật, làm việc Thứ 2-7 (days off: ${DAYS_OFF.join(", ")})`);

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

  // Create shift name to shift object map
  const shiftMap = new Map(shifts.map((s) => [s.name, s]));

  let totalCreated = 0;
  let skippedAbsent = 0;
  let skippedNoEmployee = 0;
  let skippedNoShift = 0;
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
  for (const [key, dayRecords] of groupedRecords.entries()) {
    const firstRecord = dayRecords[0];

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
    const dateParts = firstRecord.date.split("/");
    if (dateParts.length !== 3) {
      console.log(`⚠️  Invalid date format: ${firstRecord.date}`);
      skippedInvalidDate++;
      continue;
    }

    const month = parseInt(dateParts[0], 10);
    const day = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);
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
        const checkIn = workDate.hour(hour).minute(minute).second(0);
        if (!earliestCheckIn || checkIn.isBefore(earliestCheckIn)) {
          earliestCheckIn = checkIn;
        }
      }

      if (record.checkOutTime) {
        const [hour, minute] = record.checkOutTime.split(":").map(Number);
        let checkOut = workDate.hour(hour).minute(minute).second(0);

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
        note: dayRecords.length > 1 ? `Multiple shifts: ${dayRecords.map(r => r.shiftCode).join(", ")}` : undefined,
      },
    });

    // Create attendance shift records
    for (const record of dayRecords) {
      // Get shift
      const shiftName = getShiftName(record.shiftCode);
      const shift = shiftMap.get(shiftName);

      if (!shift) {
        console.log(`⚠️  Shift not found: ${shiftName} (${record.shiftCode})`);
        skippedNoShift++;
        continue;
      }

      // Calculate actual start and end times
      let actualStartTime: dayjs.Dayjs;
      let actualEndTime: dayjs.Dayjs;

      if (record.checkInTime) {
        const [hour, minute] = record.checkInTime.split(":").map(Number);
        actualStartTime = workDate.hour(hour).minute(minute).second(0);
      } else {
        // Use shift start time if no check-in
        const [hour, minute] = shift.startTime.split(":").map(Number);
        actualStartTime = workDate.hour(hour).minute(minute).second(0);
      }

      if (record.checkOutTime) {
        const [hour, minute] = record.checkOutTime.split(":").map(Number);
        actualEndTime = workDate.hour(hour).minute(minute).second(0);

        // If end is before start, it's next day
        if (actualEndTime.isBefore(actualStartTime)) {
          actualEndTime = actualEndTime.add(1, "day");
        }
      } else {
        // Use shift end time if no check-out
        const [hour, minute] = shift.endTime.split(":").map(Number);
        actualEndTime = workDate.hour(hour).minute(minute).second(0);

        // Check if shift end time indicates overnight
        const shiftEndHour = parseInt(shift.endTime.split(":")[0], 10);
        const shiftStartHour = parseInt(shift.startTime.split(":")[0], 10);
        if (shiftEndHour < shiftStartHour) {
          actualEndTime = actualEndTime.add(1, "day");
        }
      }

      const durationMinutes = actualEndTime.diff(actualStartTime, "minute");

      // Create attendance shift record
      await db.attendanceShift.create({
        data: {
          attendanceId: attendance.id,
          shiftId: shift.id,
          workDate: workDate.toDate(),
          actualStartTime: actualStartTime.toDate(),
          actualEndTime: actualEndTime.toDate(),
          durationMinutes,
          lateMinutes: record.lateMinutes,
          earlyLeaveMinutes: record.earlyLeaveMinutes,
          isApproved: record.lateMinutes === 0 && record.earlyLeaveMinutes === 0,
          note: record.lateMinutes > 0
            ? `Đi muộn ${record.lateMinutes} phút`
            : record.earlyLeaveMinutes > 0
              ? `Về sớm ${record.earlyLeaveMinutes} phút`
              : undefined,
        },
      });

      totalCreated++;
    }
  }

  console.log("\n✅ Attendance seeding completed!");
  console.log(`   📊 Total attendance records created: ${totalCreated}`);
  console.log(`   ⏭️  Skipped absent records: ${skippedAbsent}`);
  console.log(`   ⚠️  Skipped (employee not found): ${skippedNoEmployee}`);
  console.log(`   ⚠️  Skipped (shift not found): ${skippedNoShift}`);
  console.log(`   ⚠️  Skipped (invalid date): ${skippedInvalidDate}`);
}
