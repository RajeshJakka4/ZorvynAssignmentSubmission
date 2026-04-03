import assert from "node:assert/strict";
import test from "node:test";
import { createDatabase } from "./db/database";
import { authenticate } from "./middleware/auth";
import { authorize } from "./middleware/authorize";
import { createRecord, listRecords } from "./services/recordService";
import { getDashboardSummary } from "./services/dashboardService";
import { parsePositiveInteger } from "./utils/validation";

function buildTestDb() {
  return createDatabase(":memory:");
}

test("dashboard summary computes seeded totals", () => {
  const db = buildTestDb();
  const summary = getDashboardSummary(db);

  assert.equal(summary.totals.totalIncome, 198000);
  assert.equal(summary.totals.totalExpenses, 52500);
  assert.equal(summary.totals.netBalance, 145500);
});

test("authorization blocks viewer from analyst-only resources", () => {
  const middleware = authorize("analyst", "admin");
  let forwardedError: unknown;

  middleware(
    {
      currentUser: {
        id: 3,
        name: "Viewer User",
        email: "viewer@finance.local",
        role: "viewer",
        status: "active"
      }
    } as never,
    {} as never,
    (error?: unknown) => {
      forwardedError = error;
    }
  );

  assert.equal((forwardedError as Error).message, "Role viewer cannot access this resource");
});

test("admin can create and filter records", () => {
  const db = buildTestDb();

  const record = createRecord(
    db,
    {
      amount: 9000,
      type: "expense",
      category: "Travel",
      recordDate: "2026-04-02",
      notes: "Client visit"
    },
    1
  );

  assert.equal(record.category, "Travel");

  const result = listRecords(db, {
    category: "tra",
    page: "1",
    pageSize: "10"
  });

  assert.equal(result.pagination.total, 1);
  assert.equal(result.pagination.totalPages, 1);
  assert.equal(result.data[0]?.id, record.id);
});

test("record filters reject invalid date ranges", () => {
  const db = buildTestDb();

  assert.throws(
    () =>
      listRecords(db, {
        dateFrom: "2026-04-30",
        dateTo: "2026-04-01"
      }),
    {
      message: "Validation failed"
    }
  );
});

test("unknown x-user-id returns unauthorized error", () => {
  const db = buildTestDb();
  const middleware = authenticate(db);
  let forwardedError: unknown;

  middleware(
    {
      path: "/api/users/me",
      header: (key: string) => (key === "x-user-id" ? "999" : undefined)
    } as never,
    {} as never,
    (error?: unknown) => {
      forwardedError = error;
    }
  );

  assert.equal((forwardedError as Error).message, "Unknown x-user-id");
});

test("parsePositiveInteger rejects invalid values", () => {
  assert.throws(() => parsePositiveInteger("not-a-number", "id"), {
    message: "id must be a positive integer"
  });
});
