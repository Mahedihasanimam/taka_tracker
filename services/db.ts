import * as SQLite from "expo-sqlite";

// Initialize the DB variable
let db: SQLite.SQLiteDatabase;

// --- INITIALIZE DATABASE & TABLES ---
export const initDB = async () => {
  // 1. Open Database Asynchronously
  db = await SQLite.openDatabaseAsync("takatrack.db");

  // 2. Execute Table Creation Queries using execAsync (for multiple statements)
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      icon TEXT,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY NOT NULL,
      category TEXT NOT NULL,
      limit_amount REAL NOT NULL
    );
  `);

  console.log("Database and Tables initialized successfully");
};

// --- CRUD OPERATIONS ---

// 1. ADD TRANSACTION
export const addTransaction = async (
  amount: number,
  type: string,
  category: string,
  date: string,
  note: string,
  icon: string,
  color: string
) => {
  // Use runAsync for INSERT/UPDATE/DELETE
  const result = await db.runAsync(
    `INSERT INTO transactions (amount, type, category, date, note, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [amount, type, category, date, note, icon, color]
  );
  return result;
};

// 2. GET ALL TRANSACTIONS
export const getTransactions = async () => {
  // Use getAllAsync for SELECT queries that return multiple rows
  const allRows = await db.getAllAsync(
    `SELECT * FROM transactions ORDER BY date DESC`
  );
  return allRows;
};

// 3. GET TOTAL BALANCE
export const getBalance = async () => {
  // Use getFirstAsync for SELECT queries that return a single result/row
  const result = await db.getFirstAsync<{
    totalIncome: number;
    totalExpense: number;
  }>(
    `SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpense
     FROM transactions`
  );

  // Return result or defaults if null (e.g. fresh install)
  return result || { totalIncome: 0, totalExpense: 0 };
};

// 4. DELETE TRANSACTION
export const deleteTransaction = async (id: number) => {
  const result = await db.runAsync(`DELETE FROM transactions WHERE id = ?`, [
    id,
  ]);
  return result;
};
