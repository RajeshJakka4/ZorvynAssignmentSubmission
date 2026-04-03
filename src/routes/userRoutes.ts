import { Database } from "better-sqlite3";
import { Router } from "express";
import { authorize } from "../middleware/authorize";
import { createUser, getUserById, listUsers, updateUser } from "../services/userService";
import { parsePositiveInteger } from "../utils/validation";

export function createUserRouter(db: Database) {
  const router = Router();

  router.get("/", authorize("admin"), (_req, res) => {
    res.json({ data: listUsers(db) });
  });

  router.get("/me", (req, res) => {
    res.json({ data: req.currentUser });
  });

  router.get("/:id", authorize("admin"), (req, res) => {
    const userId = parsePositiveInteger(req.params.id, "id");
    res.json({ data: getUserById(db, userId) });
  });

  router.post("/", authorize("admin"), (req, res) => {
    const user = createUser(db, req.body);
    res.status(201).json({ data: user });
  });

  router.patch("/:id", authorize("admin"), (req, res) => {
    const userId = parsePositiveInteger(req.params.id, "id");
    const user = updateUser(db, userId, req.body);
    res.json({ data: user });
  });

  return router;
}
