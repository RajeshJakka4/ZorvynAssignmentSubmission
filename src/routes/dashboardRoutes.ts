import { Database } from "better-sqlite3";
import { Router } from "express";
import { authorize } from "../middleware/authorize";
import { getDashboardSummary } from "../services/dashboardService";

export function createDashboardRouter(db: Database) {
  const router = Router();

  router.get("/summary", authorize("viewer", "analyst", "admin"), (_req, res) => {
    res.json({ data: getDashboardSummary(db) });
  });

  return router;
}
