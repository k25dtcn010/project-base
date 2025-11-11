import "dotenv/config";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "@project-base/auth";

import attendanceRoutes from "./routes/attendance";
import employeeRoutes from "./routes/employee";
import requestRoutes from "./routes/request";
import scheduleRoutes from "./routes/schedule";
import shiftRoutes from "./routes/shift";
import shiftScheduleRoutes from "./routes/shift-schedule";

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3001",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// Register attendance system routes
app.route("/api/attendance", attendanceRoutes);
app.route("/api/schedules", scheduleRoutes);
app.route("/api/requests", requestRoutes);
app.route("/api/shifts", shiftRoutes);
app.route("/api/shift-schedules", shiftScheduleRoutes);
app.route("/api/employees", employeeRoutes);

export default app;
