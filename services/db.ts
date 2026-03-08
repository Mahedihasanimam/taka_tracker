import * as Crypto from "expo-crypto";
import * as SQLite from "expo-sqlite";

// Initialize the DB variable
let db: SQLite.SQLiteDatabase | null = null;
let dbInitPromise: Promise<boolean> | null = null;

// --- USER TYPE ---
export interface User {
  id: number;
  name: string;
  phone: string;
  password: string;
  created_at: string;
}

export interface TransactionRecord {
  id: number;
  user_id?: number;
  amount: number;
  type: string;
  category: string;
  date: string;
  note?: string;
  icon?: string;
  color?: string;
}

export interface UserBackupPayload {
  user: Pick<User, "id" | "name" | "phone" | "created_at"> | null;
  transactions: TransactionRecord[];
  categories: {
    id: number;
    user_id?: number;
    name: string;
    type: string;
    icon: string;
    color: string;
  }[];
  budgets: {
    id: number;
    user_id?: number;
    category: string;
    limit_amount: number;
  }[];
  exported_at: string;
}

// --- INITIALIZE DATABASE & TABLES ---
export const initDB = async (): Promise<boolean> => {
  // If already initializing, wait for it
  if (dbInitPromise) {
    return dbInitPromise;
  }

  // If already initialized and db exists, return true
  if (db) {
    try {
      // Test if connection is still valid
      await db.getFirstAsync(`SELECT 1`);
      return true;
    } catch {
      // Connection lost, need to reinitialize
      db = null;
    }
  }

  dbInitPromise = (async () => {
    try {
      db = await SQLite.openDatabaseAsync("takatrack.db");

      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          phone TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS auth_tokens (
          id INTEGER PRIMARY KEY NOT NULL,
          user_id INTEGER NOT NULL,
          token TEXT NOT NULL UNIQUE,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          expires_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY NOT NULL,
          user_id INTEGER,
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
          user_id INTEGER,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS budgets (
          id INTEGER PRIMARY KEY NOT NULL,
          user_id INTEGER,
          category TEXT NOT NULL,
          limit_amount REAL NOT NULL
        );
      `);

      // Migrations: Add columns if they don't exist
      const migrations = [
        { table: "transactions", column: "user_id", type: "INTEGER" },
        { table: "categories", column: "user_id", type: "INTEGER" },
        { table: "budgets", column: "user_id", type: "INTEGER" },
      ];

      for (const migration of migrations) {
        try {
          await db.execAsync(
            `ALTER TABLE ${migration.table} ADD COLUMN ${migration.column} ${migration.type}`,
          );
          console.log(`Added ${migration.column} to ${migration.table}`);
        } catch (e) {
          // Column already exists, ignore
        }
      }

      console.log("Database and Tables initialized successfully");
      return true;
    } catch (error) {
      console.error("Database initialization failed:", error);
      db = null;
      throw error;
    } finally {
      dbInitPromise = null;
    }
  })();

  return dbInitPromise;
};

// Helper to ensure DB is ready before operations .
const ensureDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    await initDB();
  }

  if (!db) {
    throw new Error("Database not initialized");
  }

  // Test connection
  try {
    await db.getFirstAsync(`SELECT 1`);
  } catch {
    // Reconnect if connection lost
    db = null;
    await initDB();
    if (!db) {
      throw new Error("Failed to reconnect to database");
    }
  }

  return db;
};

// --- TOKEN MANAGEMENT ---

const generateToken = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  const token = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return token;
};

export const createAuthToken = async (
  userId: number,
): Promise<{ token: string; expiresAt: string } | null> => {
  try {
    const database = await ensureDB();
    const token = await generateToken();
    const expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    await database.runAsync(`DELETE FROM auth_tokens WHERE user_id = ?`, [
      userId,
    ]);
    await database.runAsync(
      `INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`,
      [userId, token, expiresAt],
    );

    return { token, expiresAt };
  } catch (error) {
    console.error("Create token error:", error);
    return null;
  }
};

export const validateToken = async (
  token: string,
): Promise<{ valid: boolean; user?: User }> => {
  try {
    const database = await ensureDB();
    const tokenData = await database.getFirstAsync<{
      user_id: number;
      expires_at: string;
    }>(`SELECT user_id, expires_at FROM auth_tokens WHERE token = ?`, [token]);

    if (!tokenData) {
      return { valid: false };
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      await database.runAsync(`DELETE FROM auth_tokens WHERE token = ?`, [
        token,
      ]);
      return { valid: false };
    }

    const user = await getUserById(tokenData.user_id);
    if (!user) {
      return { valid: false };
    }

    return { valid: true, user };
  } catch (error) {
    console.error("Validate token error:", error);
    return { valid: false };
  }
};

export const deleteAuthToken = async (token: string): Promise<boolean> => {
  try {
    const database = await ensureDB();
    await database.runAsync(`DELETE FROM auth_tokens WHERE token = ?`, [token]);
    return true;
  } catch (error) {
    console.error("Delete token error:", error);
    return false;
  }
};

// --- USER AUTHENTICATION ---

export const registerUser = async (
  name: string,
  phone: string,
  password: string,
): Promise<{ success: boolean; message: string; userId?: number }> => {
  try {
    const database = await ensureDB();

    const existingUser = await database.getFirstAsync<User>(
      `SELECT * FROM users WHERE phone = ?`,
      [phone],
    );

    if (existingUser) {
      return { success: false, message: "Phone number already registered" };
    }

    const result = await database.runAsync(
      `INSERT INTO users (name, phone, password) VALUES (?, ?, ?)`,
      [name, phone, password],
    );

    return {
      success: true,
      message: "Registration successful",
      userId: result.lastInsertRowId,
    };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, message: "Registration failed" };
  }
};

export const loginUser = async (
  phone: string,
  password: string,
): Promise<{
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  expiresAt?: string;
}> => {
  try {
    const database = await ensureDB();

    const user = await database.getFirstAsync<User>(
      `SELECT * FROM users WHERE phone = ? AND password = ?`,
      [phone, password],
    );

    if (user) {
      const tokenData = await createAuthToken(user.id);
      if (tokenData) {
        return {
          success: true,
          message: "Login successful",
          user,
          token: tokenData.token,
          expiresAt: tokenData.expiresAt,
        };
      }
      return { success: true, message: "Login successful", user };
    } else {
      return { success: false, message: "Invalid phone or password" };
    }
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "Login failed" };
  }
};

export const getUserById = async (id: number): Promise<User | null> => {
  try {
    const database = await ensureDB();
    const user = await database.getFirstAsync<User>(
      `SELECT * FROM users WHERE id = ?`,
      [id],
    );
    return user || null;
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
};

export const checkPhoneExists = async (phone: string): Promise<boolean> => {
  try {
    const database = await ensureDB();
    const user = await database.getFirstAsync<User>(
      `SELECT id FROM users WHERE phone = ?`,
      [phone],
    );
    return !!user;
  } catch (error) {
    console.error("Check phone error:", error);
    return false;
  }
};

export const resetPassword = async (
  phone: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const database = await ensureDB();
    const result = await database.runAsync(
      `UPDATE users SET password = ? WHERE phone = ?`,
      [newPassword, phone],
    );

    if (result.changes > 0) {
      const user = await database.getFirstAsync<User>(
        `SELECT id FROM users WHERE phone = ?`,
        [phone],
      );
      if (user) {
        await database.runAsync(`DELETE FROM auth_tokens WHERE user_id = ?`, [
          user.id,
        ]);
      }
      return { success: true, message: "Password reset successful" };
    }
    return { success: false, message: "User not found" };
  } catch (error) {
    console.error("Reset password error:", error);
    return { success: false, message: "Password reset failed" };
  }
};

export const changeUserPassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const database = await ensureDB();

    const user = await database.getFirstAsync<User>(
      `SELECT * FROM users WHERE id = ? AND password = ?`,
      [userId, currentPassword],
    );

    if (!user) {
      return { success: false, message: "Current password is incorrect" };
    }

    await database.runAsync(`UPDATE users SET password = ? WHERE id = ?`, [
      newPassword,
      userId,
    ]);

    await database.runAsync(`DELETE FROM auth_tokens WHERE user_id = ?`, [
      userId,
    ]);

    return { success: true, message: "Password changed successfully" };
  } catch (error) {
    console.error("Change password error:", error);
    return { success: false, message: "Failed to change password" };
  }
};

export const updateUserProfile = async (
  userId: number,
  name: string,
): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const database = await ensureDB();

    await database.runAsync(`UPDATE users SET name = ? WHERE id = ?`, [
      name,
      userId,
    ]);

    const updatedUser = await getUserById(userId);

    if (updatedUser) {
      return {
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      };
    }
    return { success: false, message: "Failed to update profile" };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, message: "Failed to update profile" };
  }
};

// --- CRUD OPERATIONS ---

const parseTransactionDate = (value: string): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isSameMonth = (date: Date, reference: Date): boolean =>
  date.getFullYear() === reference.getFullYear() &&
  date.getMonth() === reference.getMonth();

const sortTransactionsDesc = (
  first: TransactionRecord,
  second: TransactionRecord,
) => {
  const firstDate = parseTransactionDate(first.date);
  const secondDate = parseTransactionDate(second.date);
  const firstTime = firstDate ? firstDate.getTime() : 0;
  const secondTime = secondDate ? secondDate.getTime() : 0;
  return secondTime - firstTime;
};

// 1. ADD TRANSACTION
export const addTransaction = async (
  userId: number,
  amount: number,
  type: string,
  category: string,
  date: string,
  note: string,
  icon: string,
  color: string,
) => {
  const database = await ensureDB();
  const result = await database.runAsync(
    `INSERT INTO transactions (user_id, amount, type, category, date, note, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, amount, type, category, date, note, icon, color],
  );
  return result;
};

// 2. GET ALL TRANSACTIONS
export const getTransactions = async (
  userId?: number,
  options?: { month?: Date; all?: boolean },
) => {
  const database = await ensureDB();
  const targetMonth = options?.month ?? new Date();

  let rows: TransactionRecord[];
  if (userId) {
    rows = await database.getAllAsync<TransactionRecord>(
      `SELECT * FROM transactions WHERE user_id = ?`,
      [userId],
    );
  } else {
    rows = await database.getAllAsync<TransactionRecord>(
      `SELECT * FROM transactions`,
    );
  }

  const filtered = options?.all
    ? rows
    : rows.filter((transaction) => {
        const transactionDate = parseTransactionDate(transaction.date);
        return transactionDate
          ? isSameMonth(transactionDate, targetMonth)
          : false;
      });

  return filtered.sort(sortTransactionsDesc);
};

// 3. GET TOTAL BALANCE
export const getBalance = async (
  userId?: number,
  options?: { month?: Date; all?: boolean },
) => {
  const transactions = await getTransactions(userId, options);
  return transactions.reduce(
    (acc, transaction) => {
      if (transaction.type === "income") {
        acc.totalIncome += Number(transaction.amount) || 0;
      } else if (transaction.type === "expense") {
        acc.totalExpense += Number(transaction.amount) || 0;
      }
      return acc;
    },
    { totalIncome: 0, totalExpense: 0 },
  );
};

// 4. DELETE TRANSACTION
export const deleteTransaction = async (id: number) => {
  const database = await ensureDB();
  const result = await database.runAsync(
    `DELETE FROM transactions WHERE id = ?`,
    [id],
  );
  return result;
};

// 5. UPDATE TRANSACTION
export const updateTransaction = async (
  id: number,
  amount: number,
  type: string,
  category: string,
  date: string,
  note: string,
  icon: string,
  color: string,
) => {
  const database = await ensureDB();
  const result = await database.runAsync(
    `UPDATE transactions SET amount = ?, type = ?, category = ?, date = ?, note = ?, icon = ?, color = ? WHERE id = ?`,
    [amount, type, category, date, note, icon, color, id],
  );
  return result;
};

// --- CATEGORY OPERATIONS ---

export const addCategory = async (
  userId: number,
  name: string,
  type: string,
  icon: string,
  color: string,
) => {
  const database = await ensureDB();
  const result = await database.runAsync(
    `INSERT INTO categories (user_id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)`,
    [userId, name, type, icon, color],
  );
  return result;
};

export const getCategories = async (type?: string, userId?: number) => {
  const database = await ensureDB();

  // Check if user_id column exists
  let hasUserIdColumn = true;
  try {
    await database.getFirstAsync(`SELECT user_id FROM categories LIMIT 1`);
  } catch {
    hasUserIdColumn = false;
  }

  if (!hasUserIdColumn) {
    // Fallback for old schema without user_id
    if (type) {
      return await database.getAllAsync(
        `SELECT * FROM categories WHERE type = ? ORDER BY name`,
        [type],
      );
    }
    return await database.getAllAsync(`SELECT * FROM categories ORDER BY name`);
  }

  // New schema with user_id
  if (type && userId) {
    return await database.getAllAsync(
      `SELECT * FROM categories WHERE type = ? AND (user_id = ? OR user_id IS NULL) ORDER BY name`,
      [type, userId],
    );
  }
  if (type) {
    return await database.getAllAsync(
      `SELECT * FROM categories WHERE type = ? ORDER BY name`,
      [type],
    );
  }
  if (userId) {
    return await database.getAllAsync(
      `SELECT * FROM categories WHERE user_id = ? OR user_id IS NULL ORDER BY name`,
      [userId],
    );
  }
  return await database.getAllAsync(`SELECT * FROM categories ORDER BY name`);
};

export const updateCategory = async (
  id: number,
  name: string,
  type: string,
  icon: string,
  color: string,
) => {
  const database = await ensureDB();
  const result = await database.runAsync(
    `UPDATE categories SET name = ?, type = ?, icon = ?, color = ? WHERE id = ?`,
    [name, type, icon, color, id],
  );
  return result;
};

export const deleteCategory = async (id: number) => {
  const database = await ensureDB();
  const result = await database.runAsync(
    `DELETE FROM categories WHERE id = ?`,
    [id],
  );
  return result;
};

// --- BUDGET OPERATIONS ---

export const addBudget = async (
  userId: number,
  category: string,
  limitAmount: number,
) => {
  const database = await ensureDB();
  const result = await database.runAsync(
    `INSERT INTO budgets (user_id, category, limit_amount) VALUES (?, ?, ?)`,
    [userId, category, limitAmount],
  );
  return result;
};

export const getBudgets = async (userId?: number) => {
  const database = await ensureDB();
  if (userId) {
    return await database.getAllAsync(
      `SELECT * FROM budgets WHERE user_id = ? OR user_id IS NULL`,
      [userId],
    );
  }
  return await database.getAllAsync(`SELECT * FROM budgets`);
};

export const updateBudget = async (id: number, limitAmount: number) => {
  const database = await ensureDB();
  const result = await database.runAsync(
    `UPDATE budgets SET limit_amount = ? WHERE id = ?`,
    [limitAmount, id],
  );
  return result;
};

export const deleteBudget = async (id: number) => {
  const database = await ensureDB();
  const result = await database.runAsync(`DELETE FROM budgets WHERE id = ?`, [
    id,
  ]);
  return result;
};

// Get total spent by category (for current month)
export const getTransactionsByCategory = async (
  category: string,
  type: string,
  userId?: number,
  month: Date = new Date(),
): Promise<number> => {
  const transactions = await getTransactions(userId, { month, all: false });
  return transactions
    .filter(
      (transaction) =>
        transaction.category === category && transaction.type === type,
    )
    .reduce(
      (total, transaction) => total + (Number(transaction.amount) || 0),
      0,
    );
};

export const getUserBackupPayload = async (
  userId: number,
): Promise<UserBackupPayload> => {
  const database = await ensureDB();
  const [user, transactions, categories, budgets] = await Promise.all([
    database.getFirstAsync<Pick<User, "id" | "name" | "phone" | "created_at">>(
      `SELECT id, name, phone, created_at FROM users WHERE id = ?`,
      [userId],
    ),
    getTransactions(userId, { all: true }),
    database.getAllAsync(
      `SELECT id, user_id, name, type, icon, color FROM categories WHERE user_id = ?`,
      [userId],
    ),
    database.getAllAsync(
      `SELECT id, user_id, category, limit_amount FROM budgets WHERE user_id = ?`,
      [userId],
    ),
  ]);

  return {
    user: user || null,
    transactions,
    categories,
    budgets,
    exported_at: new Date().toISOString(),
  };
};

export const resetUserData = async (userId: number): Promise<boolean> => {
  const database = await ensureDB();
  try {
    await database.withTransactionAsync(async () => {
      await database.runAsync(`DELETE FROM transactions WHERE user_id = ?`, [
        userId,
      ]);
      await database.runAsync(`DELETE FROM budgets WHERE user_id = ?`, [
        userId,
      ]);
      await database.runAsync(`DELETE FROM categories WHERE user_id = ?`, [
        userId,
      ]);
    });
    return true;
  } catch (error) {
    console.error("Reset user data error:", error);
    return false;
  }
};

export const restoreUserDataFromBackup = async (
  userId: number,
  payload: UserBackupPayload,
): Promise<boolean> => {
  const database = await ensureDB();

  try {
    await database.withTransactionAsync(async () => {
      await database.runAsync(`DELETE FROM transactions WHERE user_id = ?`, [
        userId,
      ]);
      await database.runAsync(`DELETE FROM budgets WHERE user_id = ?`, [
        userId,
      ]);
      await database.runAsync(`DELETE FROM categories WHERE user_id = ?`, [
        userId,
      ]);

      for (const category of payload.categories || []) {
        await database.runAsync(
          `INSERT INTO categories (user_id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)`,
          [userId, category.name, category.type, category.icon, category.color],
        );
      }

      for (const budget of payload.budgets || []) {
        await database.runAsync(
          `INSERT INTO budgets (user_id, category, limit_amount) VALUES (?, ?, ?)`,
          [userId, budget.category, budget.limit_amount],
        );
      }

      for (const transaction of payload.transactions || []) {
        await database.runAsync(
          `INSERT INTO transactions (user_id, amount, type, category, date, note, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            transaction.amount,
            transaction.type,
            transaction.category,
            transaction.date,
            transaction.note || "",
            transaction.icon || "",
            transaction.color || "",
          ],
        );
      }
    });

    return true;
  } catch (error) {
    console.error("Restore user data error:", error);
    return false;
  }
};
