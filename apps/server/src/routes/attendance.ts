import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { analyzeAttendance, db } from "@project-base/db";

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
    }),
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
          400,
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
  },
);

// Check-out endpoint
attendance.post(
  "/check-out",
  zValidator(
    "json",
    z.object({
      employeeId: z.string(),
      note: z.string().optional(),
    }),
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
        return c.json({ error: "No open attendance found. Please check in first." }, 400);
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
  },
);

// Get all employees attendance for admin view
// Optimized to prevent N+1 queries:
// - 1 query for employees
// - 1 query for attendance shifts with all relations pre-loaded
attendance.get(
  "/all",
  zValidator(
    "query",
    z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      companyId: z.string().optional(),
      departmentId: z.string().optional(),
    }),
  ),
  async (c) => {
    try {
      const { from, to, companyId, departmentId } = c.req.valid("query");

      // Build date filter
      const dateFilter: any = {};
      if (from) {
        dateFilter.gte = new Date(from);
      }
      if (to) {
        dateFilter.lte = new Date(to);
      }

      // Build employee filter
      const employeeFilter: any = {};
      if (companyId) {
        employeeFilter.companyId = companyId;
      }
      if (departmentId) {
        employeeFilter.departmentId = departmentId;
      }

      // Query 1: Get all employees matching filters (with department and company pre-loaded)
      const employees = await db.employee.findMany({
        where: employeeFilter,
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          department: { select: { name: true } },
          company: { select: { name: true } },
        },
        orderBy: [{ department: { name: "asc" } }, { fullName: "asc" }],
      });

      // Early return if no employees
      if (employees.length === 0) {
        return c.json({ data: [] });
      }

      // Query 2: Get attendance shifts for filtered employees in date range
      // Using nested include to load all relations in single query
      const employeeIds = employees.map((emp) => emp.id);
      const where: any = {
        attendance: {
          employeeId: {
            in: employeeIds,
          },
        },
      };
      if (Object.keys(dateFilter).length > 0) {
        where.workDate = dateFilter;
      }

      const attendanceShifts = await db.attendanceShift.findMany({
        where,
        include: {
          shift: {
            select: {
              id: true,
              name: true,
              startTime: true,
              endTime: true,
              description: true,
              isActive: true,
              companyId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          attendance: {
            select: {
              id: true,
              employeeId: true,
              checkInTime: true,
              checkOutTime: true,
              location: true,
              note: true,
              isMissingCheckOut: true,
              managerConfirmedBy: true,
              managerConfirmedAt: true,
              createdAt: true,
              updatedAt: true,
              employee: {
                select: {
                  id: true,
                  employeeCode: true,
                  fullName: true,
                  department: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: [{ workDate: "asc" }],
      });

      // Group shifts by employee (in-memory aggregation, no additional queries)
      const employeeDataMap = new Map<
        string,
        {
          employee: (typeof employees)[0];
          shifts: typeof attendanceShifts;
        }
      >();

      employees.forEach((emp) => {
        employeeDataMap.set(emp.id, {
          employee: emp,
          shifts: [],
        });
      });

      attendanceShifts.forEach((shift) => {
        const empId = shift.attendance.employeeId;
        const empData = employeeDataMap.get(empId);
        if (empData) {
          empData.shifts.push(shift);
        }
      });

      // Convert to array
      const result = Array.from(employeeDataMap.values()).map((data) => ({
        employee: data.employee,
        attendanceShifts: data.shifts,
      }));

      return c.json({ data: result });
    } catch (error) {
      console.error("Get all attendance error:", error);
      return c.json({ error: "Failed to fetch all attendance data" }, 500);
    }
  },
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
    }),
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
  },
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
    }),
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
          note: note
            ? `${attendance.note || ""}\n[Manager confirmed] ${note}`.trim()
            : attendance.note,
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
  },
);

export default attendance;
