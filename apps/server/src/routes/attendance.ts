import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@project-base/db";
import { analyzeAttendance } from "../services/shift-analyzer";

const attendance = new Hono();

// Check-in endpoint
attendance.post(
  "/check-in",
  zValidator(
    "json",
    z.object({
      employeeId: z.string(),
      location: z.string().optional(),
      note: z.string().optional(),
    })
  ),
  async (c) => {
    try {
      const { employeeId, location, note } = c.req.valid("json");

      // Check if employee exists
      const employee = await db.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        return c.json({ error: "Employee not found" }, 404);
      }

      // Check if there's already an open attendance (no check-out) today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingAttendance = await db.attendance.findFirst({
        where: {
          employeeId,
          checkInTime: { gte: today, lt: tomorrow },
          checkOutTime: null,
        },
      });

      if (existingAttendance) {
        return c.json(
          {
            error: "Already checked in today",
            attendance: existingAttendance,
          },
          400
        );
      }

      // Create new attendance record
      const attendance = await db.attendance.create({
        data: {
          employeeId,
          checkInTime: new Date(),
          location,
          note,
        },
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              department: { select: { name: true } },
            },
          },
        },
      });

      return c.json({
        message: "Check-in successful",
        attendance,
      });
    } catch (error) {
      console.error("Check-in error:", error);
      return c.json({ error: "Failed to check in" }, 500);
    }
  }
);

// Check-out endpoint
attendance.post(
  "/check-out",
  zValidator(
    "json",
    z.object({
      employeeId: z.string(),
      note: z.string().optional(),
    })
  ),
  async (c) => {
    try {
      const { employeeId, note } = c.req.valid("json");

      // Find open attendance (no check-out)
      const openAttendance = await db.attendance.findFirst({
        where: {
          employeeId,
          checkOutTime: null,
        },
        orderBy: { checkInTime: "desc" },
      });

      if (!openAttendance) {
        return c.json(
          { error: "No open attendance found. Please check in first." },
          400
        );
      }

      // Update with check-out time
      const updatedAttendance = await db.attendance.update({
        where: { id: openAttendance.id },
        data: {
          checkOutTime: new Date(),
          note: note ? `${openAttendance.note || ""}\n${note}`.trim() : openAttendance.note,
        },
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              department: { select: { name: true } },
            },
          },
        },
      });

      // Trigger shift analysis
      await analyzeAttendance(updatedAttendance.id);

      // Fetch created shifts
      const shifts = await db.attendanceShift.findMany({
        where: { attendanceId: updatedAttendance.id },
        include: { shift: true },
      });

      return c.json({
        message: "Check-out successful",
        attendance: updatedAttendance,
        shifts,
      });
    } catch (error) {
      console.error("Check-out error:", error);
      return c.json({ error: "Failed to check out" }, 500);
    }
  }
);

// Get attendance history for an employee
attendance.get(
  "/employee/:employeeId",
  zValidator(
    "query",
    z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    })
  ),
  async (c) => {
    try {
      const { employeeId } = c.req.param();
      const { from, to, page = "1", limit = "20" } = c.req.valid("query");

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build date filter
      const dateFilter: any = {};
      if (from) {
        dateFilter.gte = new Date(from);
      }
      if (to) {
        dateFilter.lte = new Date(to);
      }

      const where: any = { employeeId };
      if (Object.keys(dateFilter).length > 0) {
        where.checkInTime = dateFilter;
      }

      // Get total count
      const total = await db.attendance.count({ where });

      // Get attendance records
      const attendances = await db.attendance.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              department: { select: { name: true } },
            },
          },
          attendanceShifts: {
            include: { shift: true },
            orderBy: { workDate: "asc" },
          },
        },
        orderBy: { checkInTime: "desc" },
        skip,
        take: limitNum,
      });

      return c.json({
        data: attendances,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Get attendance history error:", error);
      return c.json({ error: "Failed to fetch attendance history" }, 500);
    }
  }
);

// Manager confirm check-out for missing check-out
attendance.patch(
  "/:id/confirm-checkout",
  zValidator(
    "json",
    z.object({
      checkOutTime: z.string(),
      managerId: z.string(),
      note: z.string().optional(),
    })
  ),
  async (c) => {
    try {
      const { id } = c.req.param();
      const { checkOutTime, managerId, note } = c.req.valid("json");

      // Check if attendance exists
      const attendance = await db.attendance.findUnique({
        where: { id },
      });

      if (!attendance) {
        return c.json({ error: "Attendance not found" }, 404);
      }

      // Update with confirmed check-out time
      const updatedAttendance = await db.attendance.update({
        where: { id },
        data: {
          checkOutTime: new Date(checkOutTime),
          isMissingCheckOut: true,
          managerConfirmedBy: managerId,
          managerConfirmedAt: new Date(),
          note: note ? `${attendance.note || ""}\n[Manager confirmed] ${note}`.trim() : attendance.note,
        },
      });

      // Trigger shift analysis
      await analyzeAttendance(updatedAttendance.id);

      // Fetch created shifts
      const shifts = await db.attendanceShift.findMany({
        where: { attendanceId: updatedAttendance.id },
        include: { shift: true },
      });

      return c.json({
        message: "Check-out confirmed by manager",
        attendance: updatedAttendance,
        shifts,
      });
    } catch (error) {
      console.error("Confirm check-out error:", error);
      return c.json({ error: "Failed to confirm check-out" }, 500);
    }
  }
);

export default attendance;
