import "dotenv/config";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "@project-base/auth";

import attendanceRoutes from "./routes/attendance";
import scheduleRoutes from "./routes/schedule";
import requestRoutes from "./routes/request";
import shiftRoutes from "./routes/shift";

const app = new Hono();

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

app.all("/api/auth/**", (c) => auth.handler(c.req.raw));

// Register attendance system routes
app.route("/api/attendance", attendanceRoutes);
app.route("/api/schedules", scheduleRoutes);
app.route("/api/requests", requestRoutes);
app.route("/api/shifts", shiftRoutes);

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
