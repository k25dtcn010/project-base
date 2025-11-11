import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@project-base/db";

const shiftSchedule = new Hono();

// Get all shift schedules with filters
shiftSchedule.get("/", async (c) => {
  try {
    const employeeId = c.req.query("employeeId");
    const shiftId = c.req.query("shiftId");
    const startDate = c.req.query("startDate");
    const endDate = c.req.query("endDate");

    const where: any = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (shiftId) {
      where.shiftId = shiftId;
    }

    if (startDate || endDate) {
      where.AND = [];
      if (startDate) {
        where.AND.push({
          scheduledToDate: {
            gte: new Date(startDate),
          },
        });
      }
      if (endDate) {
        where.AND.push({
          scheduledFromDate: {
            lte: new Date(endDate),
          },
        });
      }
    }

    const schedules = await db.shiftSchedule.findMany({
      where,
      include: {
        shift: true,
        employee: {
          include: {
            department: true,
          },
        },
        manager: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return c.json({ data: schedules });
  } catch (error) {
    console.error("Get shift schedules error:", error);
    return c.json({ error: "Failed to fetch shift schedules" }, 500);
  }
});

// Get shift schedule by ID
shiftSchedule.get("/:id", async (c) => {
  try {
    const { id } = c.req.param();

    const schedule = await db.shiftSchedule.findUnique({
      where: { id },
      include: {
        shift: true,
        employee: {
          include: {
            department: true,
          },
        },
        manager: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
          },
        },
      },
    });

    if (!schedule) {
      return c.json({ error: "Shift schedule not found" }, 404);
    }

    return c.json({ data: schedule });
  } catch (error) {
    console.error("Get shift schedule error:", error);
    return c.json({ error: "Failed to fetch shift schedule" }, 500);
  }
});

// Create new shift schedule
shiftSchedule.post(
  "/",
  zValidator(
    "json",
    z.object({
      shiftId: z.string(),
      employeeId: z.string(),
      scheduledFromDate: z.string(),
      scheduledToDate: z.string(),
      note: z.string().optional(),
      createdBy: z.string(),
    }),
  ),
  async (c) => {
    try {
      const {
        shiftId,
        employeeId,
        scheduledFromDate,
        scheduledToDate,
        note,
        createdBy,
      } = c.req.valid("json");

      // Validate dates
      const fromDate = new Date(scheduledFromDate);
      const toDate = new Date(scheduledToDate);

      if (fromDate > toDate) {
        return c.json({ error: "Start date must be before end date" }, 400);
      }

      // Validate shift exists
      const shift = await db.shift.findUnique({
        where: { id: shiftId },
      });

      if (!shift) {
        return c.json({ error: "Shift not found" }, 404);
      }

      // Validate employee exists
      const employee = await db.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        return c.json({ error: "Employee not found" }, 404);
      }

      // Create schedule
      const schedule = await db.shiftSchedule.create({
        data: {
          shiftId,
          employeeId,
          scheduledFromDate: fromDate,
          scheduledToDate: toDate,
          note,
          createdBy,
        },
        include: {
          shift: true,
          employee: {
            include: {
              department: true,
            },
          },
        },
      });

      return c.json({
        message: "Shift schedule created successfully",
        data: schedule,
      });
    } catch (error) {
      console.error("Create shift schedule error:", error);
      return c.json({ error: "Failed to create shift schedule" }, 500);
    }
  },
);

// Update shift schedule
shiftSchedule.put(
  "/:id",
  zValidator(
    "json",
    z.object({
      shiftId: z.string().optional(),
      scheduledFromDate: z.string().optional(),
      scheduledToDate: z.string().optional(),
      note: z.string().optional().nullable(),
    }),
  ),
  async (c) => {
    try {
      const { id } = c.req.param();
      const updateData = c.req.valid("json");

      // Check if schedule exists
      const existingSchedule = await db.shiftSchedule.findUnique({
        where: { id },
      });

      if (!existingSchedule) {
        return c.json({ error: "Shift schedule not found" }, 404);
      }

      // Validate dates if provided
      if (updateData.scheduledFromDate || updateData.scheduledToDate) {
        const fromDate = updateData.scheduledFromDate
          ? new Date(updateData.scheduledFromDate)
          : existingSchedule.scheduledFromDate;
        const toDate = updateData.scheduledToDate
          ? new Date(updateData.scheduledToDate)
          : existingSchedule.scheduledToDate;

        if (fromDate > toDate) {
          return c.json({ error: "Start date must be before end date" }, 400);
        }
      }

      // Prepare update data
      const dataToUpdate: any = {};

      if (updateData.shiftId) {
        dataToUpdate.shiftId = updateData.shiftId;
      }

      if (updateData.scheduledFromDate) {
        dataToUpdate.scheduledFromDate = new Date(updateData.scheduledFromDate);
      }

      if (updateData.scheduledToDate) {
        dataToUpdate.scheduledToDate = new Date(updateData.scheduledToDate);
      }

      if (updateData.note !== undefined) {
        dataToUpdate.note = updateData.note;
      }

      // Update schedule
      const updatedSchedule = await db.shiftSchedule.update({
        where: { id },
        data: dataToUpdate,
        include: {
          shift: true,
          employee: {
            include: {
              department: true,
            },
          },
        },
      });

      return c.json({
        message: "Shift schedule updated successfully",
        data: updatedSchedule,
      });
    } catch (error) {
      console.error("Update shift schedule error:", error);
      return c.json({ error: "Failed to update shift schedule" }, 500);
    }
  },
);

// Delete shift schedule
shiftSchedule.delete("/:id", async (c) => {
  try {
    const { id } = c.req.param();

    // Check if schedule exists
    const existingSchedule = await db.shiftSchedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      return c.json({ error: "Shift schedule not found" }, 404);
    }

    // Delete schedule
    await db.shiftSchedule.delete({
      where: { id },
    });

    return c.json({
      message: "Shift schedule deleted successfully",
    });
  } catch (error) {
    console.error("Delete shift schedule error:", error);
    return c.json({ error: "Failed to delete shift schedule" }, 500);
  }
});

// Get schedules by employee ID for a date range
shiftSchedule.get("/employee/:employeeId", async (c) => {
  try {
    const { employeeId } = c.req.param();
    const startDate = c.req.query("startDate");
    const endDate = c.req.query("endDate");

    const where: any = {
      employeeId,
    };

    if (startDate || endDate) {
      where.AND = [];
      if (startDate) {
        where.AND.push({
          scheduledToDate: {
            gte: new Date(startDate),
          },
        });
      }
      if (endDate) {
        where.AND.push({
          scheduledFromDate: {
            lte: new Date(endDate),
          },
        });
      }
    }

    const schedules = await db.shiftSchedule.findMany({
      where,
      include: {
        shift: true,
      },
      orderBy: {
        scheduledFromDate: "asc",
      },
    });

    return c.json({ data: schedules });
  } catch (error) {
    console.error("Get employee schedules error:", error);
    return c.json({ error: "Failed to fetch employee schedules" }, 500);
  }
});

export default shiftSchedule;
