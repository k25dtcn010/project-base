import { Hono } from "hono";
import { db } from "@project-base/db";

const employee = new Hono();

// Get all employees
employee.get("/", async (c) => {
  try {
    const employees = await db.employee.findMany({
      include: {
        department: true,
        company: true,
      },
      orderBy: {
        employeeCode: "asc",
      },
    });

    return c.json({ data: employees });
  } catch (error) {
    console.error("Get employees error:", error);
    return c.json({ error: "Failed to fetch employees" }, 500);
  }
});

// Get employee by ID
employee.get("/:id", async (c) => {
  try {
    const { id } = c.req.param();

    const employee = await db.employee.findUnique({
      where: { id },
      include: {
        department: true,
        company: true,
        manager: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
          },
        },
      },
    });

    if (!employee) {
      return c.json({ error: "Employee not found" }, 404);
    }

    return c.json({ data: employee });
  } catch (error) {
    console.error("Get employee error:", error);
    return c.json({ error: "Failed to fetch employee" }, 500);
  }
});

// Search employees by name or code
employee.get("/search", async (c) => {
  try {
    const query = c.req.query("q");
    const departmentId = c.req.query("departmentId");

    const where: any = {};

    if (query) {
      where.OR = [
        { fullName: { contains: query, mode: "insensitive" } },
        { employeeCode: { contains: query, mode: "insensitive" } },
      ];
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const employees = await db.employee.findMany({
      where,
      include: {
        department: true,
      },
      orderBy: {
        employeeCode: "asc",
      },
      take: 50, // Limit results
    });

    return c.json({ data: employees });
  } catch (error) {
    console.error("Search employees error:", error);
    return c.json({ error: "Failed to search employees" }, 500);
  }
});

export default employee;
