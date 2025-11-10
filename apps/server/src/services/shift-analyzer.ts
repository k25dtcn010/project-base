import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { db } from "@project-base/db";

// Configure dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const TIMEZONE = "Asia/Ho_Chi_Minh"; // UTC+7

interface ShiftSegment {
  shiftId: string;
  shiftName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  workDate: Date;
  actualStartTime: Date;
  actualEndTime: Date;
  durationMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  note: string;
}

/**
 * Parse time string "HH:mm" and combine with a date
 */
function parseTime(dateStr: string, timeStr: string): dayjs.Dayjs {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return dayjs.tz(dateStr, TIMEZONE).hour(hours ?? 0).minute(minutes ?? 0).second(0).millisecond(0);
}

/**
 * Calculate minutes difference between two times
 */
function minutesDiff(start: dayjs.Dayjs, end: dayjs.Dayjs): number {
  return Math.max(0, end.diff(start, "minute"));
}

/**
 * Analyze attendance and create AttendanceShift records
 */
export async function analyzeAttendance(attendanceId: string): Promise<void> {
  // Load attendance with employee info
  const attendance = await db.attendance.findUnique({
    where: { id: attendanceId },
    include: { employee: true },
  });

  if (!attendance) {
    throw new Error(`Attendance ${attendanceId} not found`);
  }

  if (!attendance.checkOutTime) {
    console.log(`⏭️  Skipping analysis - attendance ${attendanceId} has no check-out time`);
    return;
  }

  // Delete old AttendanceShift records for re-analysis
  await db.attendanceShift.deleteMany({
    where: { attendanceId },
  });

  // Get all active shifts
  const shifts = await db.shift.findMany({
    where: { isActive: true },
    orderBy: { startTime: "asc" },
  });

  if (shifts.length === 0) {
    console.log("⚠️  No active shifts found");
    return;
  }

  // Convert to timezone-aware dayjs objects
  const checkIn = dayjs(attendance.checkInTime).tz(TIMEZONE);
  const checkOut = dayjs(attendance.checkOutTime).tz(TIMEZONE);

  console.log(`📊 Analyzing attendance ${attendanceId}:`);
  console.log(`   Check-in:  ${checkIn.format("YYYY-MM-DD HH:mm")}`);
  console.log(`   Check-out: ${checkOut.format("YYYY-MM-DD HH:mm")}`);

  // Generate shift segments
  const segments = generateShiftSegments(checkIn, checkOut, shifts);

  // Create AttendanceShift records
  for (const segment of segments) {
    await db.attendanceShift.create({
      data: {
        attendanceId,
        shiftId: segment.shiftId,
        workDate: segment.workDate,
        actualStartTime: segment.actualStartTime,
        actualEndTime: segment.actualEndTime,
        durationMinutes: segment.durationMinutes,
        lateMinutes: segment.lateMinutes,
        earlyLeaveMinutes: segment.earlyLeaveMinutes,
        isApproved: false,
        note: segment.note,
      },
    });

    console.log(
      `   ✅ Created shift segment: ${segment.shiftName} on ${dayjs(segment.workDate).format("YYYY-MM-DD")}`,
    );
  }

  console.log(`✅ Analysis complete: ${segments.length} shift(s) created`);
}

/**
 * Generate shift segments from check-in/check-out timeline
 */
function generateShiftSegments(
  checkIn: dayjs.Dayjs,
  checkOut: dayjs.Dayjs,
  shifts: Array<{ id: string; name: string; startTime: string; endTime: string }>,
): ShiftSegment[] {
  const segments: ShiftSegment[] = [];
  let currentDate = checkIn.startOf("day");
  const endDate = checkOut.startOf("day");

  // Loop through each day in the attendance period
  while (currentDate.isSameOrBefore(endDate, "day")) {
    const dateStr = currentDate.format("YYYY-MM-DD");

    // Check each shift for overlap with attendance on this day
    for (const shift of shifts) {
      const shiftStart = parseTime(dateStr, shift.startTime);
      let shiftEnd = parseTime(dateStr, shift.endTime);

      // Handle cross-midnight shifts (e.g., 17:00-00:00, 00:00-06:00)
      if (shift.endTime <= shift.startTime) {
        // Cross-midnight: shift ends next day
        shiftEnd = shiftEnd.add(1, "day");
      }

      // Calculate overlap between [checkIn, checkOut] and [shiftStart, shiftEnd]
      const overlapStart = dayjs.max(checkIn, shiftStart);
      const overlapEnd = dayjs.min(checkOut, shiftEnd);

      if (overlapStart.isBefore(overlapEnd)) {
        // There is an overlap
        const duration = minutesDiff(overlapStart, overlapEnd);

        // Calculate late/early minutes
        const lateMinutes = overlapStart.isAfter(shiftStart)
          ? minutesDiff(shiftStart, overlapStart)
          : 0;

        const earlyLeaveMinutes = overlapEnd.isBefore(shiftEnd)
          ? minutesDiff(overlapEnd, shiftEnd)
          : 0;

        // Generate note
        const notes: string[] = [];
        if (lateMinutes > 0) {
          notes.push(`Đến muộn ${lateMinutes} phút`);
        }
        if (earlyLeaveMinutes > 0) {
          notes.push(`Về sớm ${earlyLeaveMinutes} phút`);
        }

        segments.push({
          shiftId: shift.id,
          shiftName: shift.name,
          shiftStartTime: shift.startTime,
          shiftEndTime: shift.endTime,
          workDate: currentDate.toDate(),
          actualStartTime: overlapStart.toDate(),
          actualEndTime: overlapEnd.toDate(),
          durationMinutes: duration,
          lateMinutes,
          earlyLeaveMinutes,
          note: notes.length > 0 ? notes.join(", ") : "",
        });
      }
    }

    currentDate = currentDate.add(1, "day");
  }

  return segments;
}

/**
 * Helper function for dayjs.max
 */
dayjs.max = (...dates: dayjs.Dayjs[]): dayjs.Dayjs => {
  return dates.reduce((max, date) => (date.isAfter(max) ? date : max));
};

/**
 * Helper function for dayjs.min
 */
dayjs.min = (...dates: dayjs.Dayjs[]): dayjs.Dayjs => {
  return dates.reduce((min, date) => (date.isBefore(min) ? date : min));
};

// Extend dayjs with max/min
declare module "dayjs" {
  interface Dayjs {
    max(...dates: dayjs.Dayjs[]): dayjs.Dayjs;
    min(...dates: dayjs.Dayjs[]): dayjs.Dayjs;
  }
  function max(...dates: dayjs.Dayjs[]): dayjs.Dayjs;
  function min(...dates: dayjs.Dayjs[]): dayjs.Dayjs;
}
