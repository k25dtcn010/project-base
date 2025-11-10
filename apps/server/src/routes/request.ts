import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@project-base/db";

const request = new Hono();

// Create attendance request (worker proposes overtime/shift)
request.post(
  "/",
  zValidator(
    "json",
    z.object({
      employeeId: z.string(),
      shiftId: z.string(),
      requestedDate: z.string(),
      fromTime: z.string(),
      toTime: z.string(),
      reason: z.string(),
    })
  ),
  async (c) => {
    try {
      const { employeeId, shiftId, requestedDate, fromTime, toTime, reason } = c.req.valid("json");

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

      // Create request
      const attendanceRequest = await db.attendanceRequest.create({
        data: {
          employeeId,
          shiftId,
          requestedDate: new Date(requestedDate),
          fromTime: new Date(fromTime),
          toTime: new Date(toTime),
          reason,
          status: "PENDING",
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
      });

      return c.json({
        message: "Attendance request submitted successfully",
        request: attendanceRequest,
      });
    } catch (error) {
      console.error("Create request error:", error);
      return c.json({ error: "Failed to create attendance request" }, 500);
    }
  }
);

// Get pending requests (manager view)
request.get("/pending", async (c) => {
  try {
    const requests = await db.attendanceRequest.findMany({
      where: { status: "PENDING" },
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
      orderBy: { createdAt: "desc" },
    });

    return c.json({ data: requests });
  } catch (error) {
    console.error("Get pending requests error:", error);
    return c.json({ error: "Failed to fetch pending requests" }, 500);
  }
});

// Get all requests for an employee
request.get("/employee/:employeeId", async (c) => {
  try {
    const { employeeId } = c.req.param();

    const requests = await db.attendanceRequest.findMany({
      where: { employeeId },
      include: {
        shift: true,
        manager: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return c.json({ data: requests });
  } catch (error) {
    console.error("Get employee requests error:", error);
    return c.json({ error: "Failed to fetch employee requests" }, 500);
  }
});

// Approve request
request.patch(
  "/:id/approve",
  zValidator(
    "json",
    z.object({
      managerId: z.string(),
    })
  ),
  async (c) => {
    try {
      const { id } = c.req.param();
      const { managerId } = c.req.valid("json");

      // Check if request exists and is pending
      const attendanceRequest = await db.attendanceRequest.findUnique({
        where: { id },
      });

      if (!attendanceRequest) {
        return c.json({ error: "Request not found" }, 404);
      }

      if (attendanceRequest.status !== "PENDING") {
        return c.json({ error: "Request has already been processed" }, 400);
      }

      // Update request status
      const updatedRequest = await db.attendanceRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedBy: managerId,
          approvedAt: new Date(),
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

      // Create ShiftSchedule for the specific date (Option A approach)
      const schedule = await db.shiftSchedule.create({
        data: {
          employeeId: attendanceRequest.employeeId,
          shiftId: attendanceRequest.shiftId,
          scheduledFromDate: attendanceRequest.requestedDate,
          scheduledToDate: attendanceRequest.requestedDate,
          note: `Approved from request: ${attendanceRequest.reason}`,
          createdBy: managerId,
        },
      });

      // Auto-approve matching AttendanceShift if exists
      const updateResult = await db.attendanceShift.updateMany({
        where: {
          attendance: { employeeId: attendanceRequest.employeeId },
          shiftId: attendanceRequest.shiftId,
          workDate: attendanceRequest.requestedDate,
          isApproved: false,
        },
        data: {
          isApproved: true,
          approvedBy: managerId,
          approvedAt: new Date(),
        },
      });

      return c.json({
        message: "Request approved successfully",
        request: updatedRequest,
        schedule,
        autoApproved: {
          count: updateResult.count,
          message: updateResult.count > 0
            ? `${updateResult.count} attendance shift(s) auto-approved`
            : "No attendance shift found for this date",
        },
      });
    } catch (error) {
      console.error("Approve request error:", error);
      return c.json({ error: "Failed to approve request" }, 500);
    }
  }
);

// Reject request
request.patch(
  "/:id/reject",
  zValidator(
    "json",
    z.object({
      managerId: z.string(),
      rejectionReason: z.string(),
    })
  ),
  async (c) => {
    try {
      const { id } = c.req.param();
      const { managerId, rejectionReason } = c.req.valid("json");

      // Check if request exists and is pending
      const attendanceRequest = await db.attendanceRequest.findUnique({
        where: { id },
      });

      if (!attendanceRequest) {
        return c.json({ error: "Request not found" }, 404);
      }

      if (attendanceRequest.status !== "PENDING") {
        return c.json({ error: "Request has already been processed" }, 400);
      }

      // Update request status
      const updatedRequest = await db.attendanceRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          approvedBy: managerId,
          approvedAt: new Date(),
          rejectionReason,
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

      return c.json({
        message: "Request rejected",
        request: updatedRequest,
      });
    } catch (error) {
      console.error("Reject request error:", error);
      return c.json({ error: "Failed to reject request" }, 500);
    }
  }
);

export default request;
