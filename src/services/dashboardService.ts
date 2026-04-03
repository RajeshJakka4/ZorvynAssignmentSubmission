import { Database } from "better-sqlite3";

export function getDashboardSummary(db: Database) {
  const totals = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS total_expenses
    FROM financial_records
  `).get() as { total_income: number; total_expenses: number };

  const categoryBreakdown = db.prepare(`
    SELECT
      category,
      type,
      ROUND(SUM(amount), 2) AS total
    FROM financial_records
    GROUP BY category, type
    ORDER BY total DESC, category ASC
  `).all() as Array<{ category: string; type: string; total: number }>;

  const monthlyTrends = db.prepare(`
    SELECT
      strftime('%Y-%m', record_date) AS month,
      ROUND(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 2) AS income,
      ROUND(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 2) AS expenses
    FROM financial_records
    GROUP BY strftime('%Y-%m', record_date)
    ORDER BY month ASC
  `).all() as Array<{ month: string; income: number; expenses: number }>;

  const recentActivity = db.prepare(`
    SELECT
      fr.id,
      fr.amount,
      fr.type,
      fr.category,
      fr.record_date,
      fr.notes,
      fr.created_at,
      u.name AS created_by_name
    FROM financial_records fr
    INNER JOIN users u ON u.id = fr.created_by
    ORDER BY fr.record_date DESC, fr.id DESC
    LIMIT 5
  `).all();

  return {
    totals: {
      totalIncome: totals.total_income,
      totalExpenses: totals.total_expenses,
      netBalance: Number((totals.total_income - totals.total_expenses).toFixed(2))
    },
    categoryBreakdown,
    monthlyTrends: monthlyTrends.map((row) => ({
      ...row,
      net: Number((row.income - row.expenses).toFixed(2))
    })),
    recentActivity
  };
}
