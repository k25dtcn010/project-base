import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@project-base/db";

const schedule = new Hono();

// Create shift schedule (bulk approve)
schedule.post(
  "/",
  zValidator(
    "json",
    z.object({
      employeeId: z.string(),
      shiftId: z.string(),
      scheduledFromDate: z.string(),
      scheduledToDate: z.string(),
      note: z.string().optional(),
      createdBy: z.string(), // Manager/Admin ID
    })
  ),
  async (c) => {
    try {
      const { employeeId, shiftId, scheduledFromDate, scheduledToDate, note, createdBy } =
        c.req.valid("json");

      // Validate employee exists
      const employee = await db.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        return c.json({ error: "Employee not found" }, 404);
      }

      // Validate shift exists
      const shift = await db.shift.findUnique({
        where: { id: shiftId },
      });

      if (!shift) {
        return c.json({ error: "Shift not found" }, 404);
      }

      // Validate date range
      const fromDate = new Date(scheduledFromDate);
      const toDate = new Date(scheduledToDate);

      if (fromDate > toDate) {
        return c.json({ error: "Invalid date range: from date must be before to date" }, 400);
      }

      // Create shift schedule
      const shiftSchedule = await db.shiftSchedule.create({
        data: {
          employeeId,
          shiftId,
          scheduledFromDate: fromDate,
          scheduledToDate: toDate,
          note,
          createdBy,
        },
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
            },
          },
          shift: true,
          manager: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      // Auto-approve matching AttendanceShift records
      const updateResult = await db.attendanceShift.updateMany({
        where: {
          attendance: { employeeId },
          shiftId,
          workDate: { gte: fromDate, lte: toDate },
          isApproved: false,
        },
        data: {
          isApproved: true,
          approvedBy: createdBy,
          approvedAt: new Date(),
        },
      });

      return c.json({
        message: "Shift schedule created successfully",
        schedule: shiftSchedule,
        autoApproved: {
          count: updateResult.count,
          message: `${updateResult.count} attendance shift(s) auto-approved`,
        },
      });
    } catch (error) {
      console.error("Create schedule error:", error);
      return c.json({ error: "Failed to create shift schedule" }, 500);
    }
  }
);

// Get schedules for an employee
schedule.get(
  "/employee/:employeeId",
  zValidator(
    "query",
    z.object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
  ),
  async (c) => {
    try {
      const { employeeId } = c.req.param();
      const { from, to } = c.req.valid("query");

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
        where.scheduledFromDate = dateFilter;
      }

      const schedules = await db.shiftSchedule.findMany({
        where,
        include: {
          shift: true,
          manager: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: { scheduledFromDate: "desc" },
      });

      return c.json({ data: schedules });
    } catch (error) {
      console.error("Get employee schedules error:", error);
      return c.json({ error: "Failed to fetch schedules" }, 500);
    }
  }
);

// Get all schedules for a specific date (manager view)
schedule.get(
  "/date/:date",
  async (c) => {
    try {
      const { date } = c.req.param();
      const targetDate = new Date(date);

      const schedules = await db.shiftSchedule.findMany({
        where: {
          scheduledFromDate: { lte: targetDate },
          scheduledToDate: { gte: targetDate },
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
          shift: true,
        },
        orderBy: [{ shift: { startTime: "asc" } }, { employee: { fullName: "asc" } }],
      });

      return c.json({ data: schedules, date: targetDate });
    } catch (error) {
      console.error("Get schedules by date error:", error);
      return c.json({ error: "Failed to fetch schedules for date" }, 500);
    }
  }
);

// Delete shift schedule
schedule.delete("/:id", async (c) => {
  try {
    const { id } = c.req.param();

    // Check if schedule exists
    const schedule = await db.shiftSchedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      return c.json({ error: "Schedule not found" }, 404);
    }

    // Delete schedule
    await db.shiftSchedule.delete({
      where: { id },
    });

    // Note: We intentionally do NOT revert isApproved status on AttendanceShift
    // Once approved, it stays approved even if the schedule is deleted

    return c.json({
      message: "Schedule deleted successfully",
      note: "Approved attendance shifts remain approved",
    });
  } catch (error) {
    console.error("Delete schedule error:", error);
    return c.json({ error: "Failed to delete schedule" }, 500);
  }
});

export default schedule;
