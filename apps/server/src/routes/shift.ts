import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@project-base/db";

const shift = new Hono();

// Get all active shifts
shift.get("/", async (c) => {
  try {
    const shifts = await db.shift.findMany({
      where: { isActive: true },
      orderBy: { startTime: "asc" },
    });

    return c.json({ data: shifts });
  } catch (error) {
    console.error("Get shifts error:", error);
    return c.json({ error: "Failed to fetch shifts" }, 500);
  }
});

// Get all shifts including inactive (admin only)
shift.get("/all", async (c) => {
  try {
    const shifts = await db.shift.findMany({
      orderBy: { startTime: "asc" },
    });

    return c.json({ data: shifts });
  } catch (error) {
    console.error("Get all shifts error:", error);
    return c.json({ error: "Failed to fetch all shifts" }, 500);
  }
});

// Get shift by ID
shift.get("/:id", async (c) => {
  try {
    const { id } = c.req.param();

    const shift = await db.shift.findUnique({
      where: { id },
    });

    if (!shift) {
      return c.json({ error: "Shift not found" }, 404);
    }

    return c.json({ data: shift });
  } catch (error) {
    console.error("Get shift error:", error);
    return c.json({ error: "Failed to fetch shift" }, 500);
  }
});

// Create new shift (admin only)
shift.post(
  "/",
  zValidator(
    "json",
    z.object({
      name: z.string(),
      startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format, use HH:mm"),
      endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format, use HH:mm"),
      description: z.string().optional(),
      companyId: z.string().optional(),
    })
  ),
  async (c) => {
    try {
      const { name, startTime, endTime, description, companyId } = c.req.valid("json");

      // Validate time range
      // Note: Cross-midnight shifts (e.g., 17:00-00:00) are valid when endTime <= startTime
      const start = parseInt(startTime.replace(":", ""));
      const end = parseInt(endTime.replace(":", ""));

      if (start === end) {
        return c.json({ error: "Start time and end time cannot be the same" }, 400);
      }

      // Check for duplicate shift name
      const existing = await db.shift.findFirst({
        where: { name, isActive: true },
      });

      if (existing) {
        return c.json({ error: "Shift with this name already exists" }, 400);
      }

      // Create shift
      const shift = await db.shift.create({
        data: {
          name,
          startTime,
          endTime,
          description,
          companyId,
          isActive: true,
        },
      });

      return c.json({
        message: "Shift created successfully",
        shift,
      });
    } catch (error) {
      console.error("Create shift error:", error);
      return c.json({ error: "Failed to create shift" }, 500);
    }
  }
);

// Update shift (admin only)
shift.put(
  "/:id",
  zValidator(
    "json",
    z.object({
      name: z.string().optional(),
      startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format, use HH:mm").optional(),
      endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format, use HH:mm").optional(),
      description: z.string().optional(),
      companyId: z.string().optional().nullable(),
    })
  ),
  async (c) => {
    try {
      const { id } = c.req.param();
      const updateData = c.req.valid("json");

      // Check if shift exists
      const existingShift = await db.shift.findUnique({
        where: { id },
      });

      if (!existingShift) {
        return c.json({ error: "Shift not found" }, 404);
      }

      // Validate time range if both provided
      if (updateData.startTime && updateData.endTime) {
        const start = parseInt(updateData.startTime.replace(":", ""));
        const end = parseInt(updateData.endTime.replace(":", ""));

        if (start === end) {
          return c.json({ error: "Start time and end time cannot be the same" }, 400);
        }
      }

      // Update shift
      const updatedShift = await db.shift.update({
        where: { id },
        data: updateData,
      });

      return c.json({
        message: "Shift updated successfully",
        shift: updatedShift,
      });
    } catch (error) {
      console.error("Update shift error:", error);
      return c.json({ error: "Failed to update shift" }, 500);
    }
  }
);

// Toggle shift active status (admin only)
shift.patch("/:id/toggle", async (c) => {
  try {
    const { id } = c.req.param();

    // Check if shift exists
    const existingShift = await db.shift.findUnique({
      where: { id },
    });

    if (!existingShift) {
      return c.json({ error: "Shift not found" }, 404);
    }

    // Toggle isActive
    const updatedShift = await db.shift.update({
      where: { id },
      data: { isActive: !existingShift.isActive },
    });

    return c.json({
      message: `Shift ${updatedShift.isActive ? "activated" : "deactivated"} successfully`,
      shift: updatedShift,
    });
  } catch (error) {
    console.error("Toggle shift error:", error);
    return c.json({ error: "Failed to toggle shift status" }, 500);
  }
});

export default shift;
