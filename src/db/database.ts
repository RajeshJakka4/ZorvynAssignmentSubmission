import Database from "better-sqlite3";

const schemaSql = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('viewer', 'analyst', 'admin')),
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS financial_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL CHECK (amount >= 0),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    record_date TEXT NOT NULL,
    notes TEXT,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by) REFERENCES users(id)
  );
`;

const seedUsers = [
  ["Admin User", "admin@finance.local", "admin", "active"],
  ["Analyst User", "analyst@finance.local", "analyst", "active"],
  ["Viewer User", "viewer@finance.local", "viewer", "active"]
];

const seedRecords = [
  [150000, "income", "Consulting", "2026-03-02", "Quarterly consulting payment", 1],
  [12000, "expense", "Software", "2026-03-07", "Annual tooling renewal", 1],
  [48000, "income", "Subscription", "2026-03-15", "Recurring subscription revenue", 1],
  [18500, "expense", "Operations", "2026-03-22", "Office operations costs", 1],
  [22000, "expense", "Marketing", "2026-04-01", "Campaign spend", 1]
];

export function createDatabase(filename: string) {
  const db = new Database(filename);
  db.pragma("journal_mode = WAL");
  db.exec(schemaSql);

  const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, role, status)
      VALUES (?, ?, ?, ?)
    `);
    const insertRecord = db.prepare(`
      INSERT INTO financial_records (amount, type, category, record_date, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const seed = db.transaction(() => {
      for (const user of seedUsers) {
        insertUser.run(...user);
      }

      for (const record of seedRecords) {
        insertRecord.run(...record);
      }
    });

    seed();
  }

  return db;
}
