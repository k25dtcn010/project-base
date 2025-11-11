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

type ShiftType = "primary" | "boundary" | "overtime";

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
  shiftType: ShiftType;
  overlapPercentage: number; // Percentage of shift duration covered
}

/**
 * Parse time string "HH:mm" and combine with a date
 */
function parseTime(dateStr: string, timeStr: string): dayjs.Dayjs {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return dayjs
    .tz(dateStr, TIMEZONE)
    .hour(hours ?? 0)
    .minute(minutes ?? 0)
    .second(0)
    .millisecond(0);
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
        shiftType: segment.shiftType,
        overlapPercentage: segment.overlapPercentage,
      },
    });

    const typeLabel = segment.shiftType === "boundary" ? "🔹 Boundary" : "✅ Primary";
    console.log(
      `   ${typeLabel} shift: ${segment.shiftName} (${segment.overlapPercentage}%) on ${dayjs(segment.workDate).format("YYYY-MM-DD")}`,
    );
  }

  console.log(`✅ Analysis complete: ${segments.length} shift(s) created`);
}

/**
 * Generate shift segments from check-in/check-out timeline
 */
/**
 * Calculate shift duration in minutes
 */
function getShiftDurationMinutes(startTime: string, endTime: string): number {
  const start = dayjs(startTime, "HH:mm");
  let end = dayjs(endTime, "HH:mm");

  if (endTime <= startTime) {
    end = end.add(1, "day");
  }

  return end.diff(start, "minute");
}

/**
 * Classify shift type based on overlap characteristics
 */
function classifyShiftType(
  _duration: number,
  _shiftDuration: number,
  overlapPercentage: number,
): ShiftType {
  const BOUNDARY_THRESHOLD = 25; // 25% threshold for boundary shifts

  // If overlap is less than 25% of shift duration, it's a boundary shift
  if (overlapPercentage < BOUNDARY_THRESHOLD) {
    return "boundary";
  }

  // If overlap is significant (>= 25%), it's the primary shift
  return "primary";
}

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
        const shiftDuration = getShiftDurationMinutes(shift.startTime, shift.endTime);
        const overlapPercentage = (duration / shiftDuration) * 100;

        // Calculate late/early minutes based on actual check-in/check-out within the shift period
        // Only count as late if checkIn is AFTER shift start AND within shift period
        let lateMinutes = 0;
        if (checkIn.isAfter(shiftStart) && checkIn.isBefore(shiftEnd)) {
          lateMinutes = minutesDiff(shiftStart, checkIn);
        }

        // Only count as early leave if checkOut is BEFORE shift end AND within shift period
        let earlyLeaveMinutes = 0;
        if (checkOut.isBefore(shiftEnd) && checkOut.isAfter(shiftStart)) {
          earlyLeaveMinutes = minutesDiff(checkOut, shiftEnd);
        }

        // Classify shift type
        const shiftType = classifyShiftType(duration, shiftDuration, overlapPercentage);

        // Generate note
        const notes: string[] = [];
        if (lateMinutes > 0) {
          notes.push(`Đi muộn ${lateMinutes} phút`);
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
          shiftType,
          overlapPercentage: Math.round(overlapPercentage * 10) / 10,
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
