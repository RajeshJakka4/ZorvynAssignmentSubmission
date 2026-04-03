import express from "express";
import { Database } from "better-sqlite3";
import { authenticate } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { createDashboardRouter } from "./routes/dashboardRoutes";
import { createHealthRouter } from "./routes/healthRoutes";
import { createRecordRouter } from "./routes/recordRoutes";
import { createUserRouter } from "./routes/userRoutes";

export function createApp(db: Database) {
  const app = express();

  app.use(express.json());
  app.get("/", (_req, res) => {
    res.json({
      message: "Finance Data Processing and Access Control Backend is running.",
      usage: {
        health: "GET /health",
        currentUser: "GET /api/users/me",
        records: "GET /api/records",
        dashboardSummary: "GET /api/dashboard/summary"
      },
      authentication: {
        type: "Mock header-based authentication",
        header: "x-user-id",
        seededUsers: [
          { id: 1, role: "admin", description: "Full access" },
          { id: 2, role: "analyst", description: "Can view records and insights" },
          { id: 3, role: "viewer", description: "Can view dashboard summary only" }
        ]
      },
      examples: [
        "curl http://localhost:3000/health",
        "curl -H \"x-user-id: 3\" http://localhost:3000/api/dashboard/summary",
        "curl -H \"x-user-id: 2\" \"http://localhost:3000/api/records?page=1&pageSize=5\""
      ]
    });
  });
  app.use(createHealthRouter());
  app.use(authenticate(db));

  app.use("/api/users", createUserRouter(db));
  app.use("/api/records", createRecordRouter(db));
  app.use("/api/dashboard", createDashboardRouter(db));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
