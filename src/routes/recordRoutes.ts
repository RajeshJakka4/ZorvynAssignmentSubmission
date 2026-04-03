import { Database } from "better-sqlite3";
import { Router } from "express";
import { authorize } from "../middleware/authorize";
import { createRecord, deleteRecord, getRecordById, listRecords, updateRecord } from "../services/recordService";
import { parsePositiveInteger } from "../utils/validation";

export function createRecordRouter(db: Database) {
  const router = Router();

  router.get("/", authorize("analyst", "admin"), (req, res) => {
    res.json(listRecords(db, req.query));
  });

  router.get("/:id", authorize("analyst", "admin"), (req, res) => {
    const recordId = parsePositiveInteger(req.params.id, "id");
    res.json({ data: getRecordById(db, recordId) });
  });

  router.post("/", authorize("admin"), (req, res) => {
    const record = createRecord(db, req.body, req.currentUser!.id);
    res.status(201).json({ data: record });
  });

  router.patch("/:id", authorize("admin"), (req, res) => {
    const recordId = parsePositiveInteger(req.params.id, "id");
    res.json({ data: updateRecord(db, recordId, req.body) });
  });

  router.delete("/:id", authorize("admin"), (req, res) => {
    const recordId = parsePositiveInteger(req.params.id, "id");
    deleteRecord(db, recordId);
    res.status(204).send();
  });

  return router;
}
