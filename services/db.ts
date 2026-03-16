import * as Crypto from "expo-crypto";
import Constants from "expo-constants";
import * as SQLite from "expo-sqlite";

// Initialize the DB variable
let db: SQLite.SQLiteDatabase | null = null;
let dbInitPromise: Promise<boolean> | null = null;
const DB_NAME = "takatrack.db";
const DB_INIT_MAX_RETRIES = 2;
const SUPABASE_REQUEST_TIMEOUT_MS = 8000;

const DB_SCHEMA_STATEMENTS = [
  `PRAGMA journal_mode = WAL;`,
  `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,
  `CREATE TABLE IF NOT EXISTS auth_tokens (
      id INTEGER PRIMARY KEY NOT NULL,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );`,
  `CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY NOT NULL,
      user_id INTEGER,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      icon TEXT,
      color TEXT
    );`,
  `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY NOT NULL,
      user_id INTEGER,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL
    );`,
  `CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY NOT NULL,
      user_id INTEGER,
      category TEXT NOT NULL,
      limit_amount REAL NOT NULL
    );`,
];

const DB_MIGRATIONS = [
  { table: "transactions", column: "user_id", type: "INTEGER" },
  { table: "categories", column: "user_id", type: "INTEGER" },
  { table: "budgets", column: "user_id", type: "INTEGER" },
];

const DEFAULT_EXPENSE_CATEGORIES: Array<{ name: string; icon: string; color: string }> = [
  { name: "Food & Dining", icon: "Utensils", color: "#f97316" },
  { name: "Transport", icon: "Car", color: "#3b82f6" },
  { name: "Rent", icon: "Home", color: "#06b6d4" },
  { name: "Groceries", icon: "ShoppingBag", color: "#a855f7" },
  { name: "Utilities", icon: "Zap", color: "#eab308" },
  { name: "Internet", icon: "Wifi", color: "#0ea5e9" },
  { name: "Mobile", icon: "Smartphone", color: "#6366f1" },
  { name: "Coffee & Snacks", icon: "Coffee", color: "#b45309" },
  { name: "Healthcare", icon: "Pill", color: "#ef4444" },
  { name: "Shopping", icon: "Shirt", color: "#8b5cf6" },
  { name: "Education", icon: "GraduationCap", color: "#0f766e" },
  { name: "Entertainment", icon: "Gamepad2", color: "#ec4899" },
  { name: "Fitness", icon: "Dumbbell", color: "#16a34a" },
  { name: "Travel", icon: "Plane", color: "#0891b2" },
  { name: "Gifts & Charity", icon: "Gift", color: "#f43f5e" },
  { name: "Other", icon: "MoreHorizontal", color: "#6b7280" },
];

const DEFAULT_INCOME_CATEGORIES: Array<{ name: string; icon: string; color: string }> = [
  { name: "Salary", icon: "Briefcase", color: "#16a34a" },
  { name: "Freelance", icon: "Smartphone", color: "#0f766e" },
  { name: "Business", icon: "Briefcase", color: "#15803d" },
  { name: "Bonus", icon: "Gift", color: "#10b981" },
  { name: "Investment", icon: "Zap", color: "#2563eb" },
  { name: "Rental Income", icon: "Home", color: "#0ea5e9" },
  { name: "Refund", icon: "Gift", color: "#8b5cf6" },
  { name: "Other Income", icon: "MoreHorizontal", color: "#6b7280" },
];

const initializeSchema = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  for (const statement of DB_SCHEMA_STATEMENTS) {
    await database.execAsync(statement);
  }

  for (const migration of DB_MIGRATIONS) {
    try {
      await database.execAsync(
        `ALTER TABLE ${migration.table} ADD COLUMN ${migration.column} ${migration.type}`,
      );
      console.log(`Added ${migration.column} to ${migration.table}`);
    } catch {
      // Column already exists, ignore.
    }
  }
};

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

export interface GoogleIdentityPayload {
  providerUserId: string;
  email?: string;
  name?: string;
}

interface SupabaseConfig {
  url?: string;
  anonKey?: string;
}

interface SupabaseResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

const SUPABASE_USERS_TABLE = "app_users";
const SUPABASE_TOKENS_TABLE = "app_auth_tokens";

const getSupabaseConfig = (): SupabaseConfig => {
  const extra = (Constants.expoConfig?.extra || {}) as {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
  };

  const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const envAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;
  const extraUrl = extra.supabaseUrl;
  const extraAnonKey = extra.supabaseAnonKey;

  if (__DEV__) {
    if (envUrl && extraUrl && envUrl !== extraUrl) {
      console.warn(
        "Supabase URL mismatch between EXPO_PUBLIC_SUPABASE_URL and expo.extra.supabaseUrl. Using EXPO_PUBLIC_SUPABASE_URL.",
      );
    }
    if (envAnonKey && extraAnonKey && envAnonKey !== extraAnonKey) {
      console.warn(
        "Supabase key mismatch between EXPO_PUBLIC_SUPABASE_KEY and expo.extra.supabaseAnonKey. Using EXPO_PUBLIC_SUPABASE_KEY.",
      );
    }
  }

  return {
    url: envUrl || extraUrl,
    anonKey: envAnonKey || extraAnonKey,
  };
};

const isSupabaseAuthConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return !!url && !!anonKey;
};

const supabaseRequest = async <T>(
  endpoint: string,
  init?: RequestInit,
): Promise<SupabaseResponse<T>> => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    return { ok: false, status: 0, error: "Supabase not configured" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SUPABASE_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${url}/rest/v1/${endpoint}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        ...(init?.headers || {}),
      },
    });

    const text = await response.text();
    let data: T | undefined;

    if (text) {
      try {
        data = JSON.parse(text) as T;
      } catch {
        return {
          ok: response.ok,
          status: response.status,
          error: text,
        };
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok ? undefined : text || response.statusText,
    };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? `Request timed out after ${SUPABASE_REQUEST_TIMEOUT_MS}ms`
        : error instanceof Error
          ? error.message
          : "Network error";
    return {
      ok: false,
      status: 0,
      error: message,
    };
  } finally {
    clearTimeout(timeoutId);
  }
};

const toUser = (raw: Partial<User> & { id: number | string }): User => ({
  id: Number(raw.id),
  name: raw.name || "",
  phone: raw.phone || "",
  password: raw.password || "",
  created_at: raw.created_at || new Date().toISOString(),
});

const getSupabaseErrorMessage = (error?: string, fallback = "Cloud sync failed"): string =>
  error?.trim() ? `Cloud auth error: ${error}` : fallback;

const parseSupabaseError = (
  raw?: string,
): { code?: string; message?: string; details?: string } | null => {
  if (!raw?.trim()) {
    return null;
  }

  try {
    return JSON.parse(raw) as { code?: string; message?: string; details?: string };
  } catch {
    return null;
  }
};

const shouldFallbackToLocalAuth = (status: number, error?: string): boolean => {
  if (status === 0) {
    return true;
  }

  const parsed = parseSupabaseError(error);
  const normalizedError = (error || "").toLowerCase();
  const normalizedMessage = (parsed?.message || "").toLowerCase();
  const normalizedDetails = (parsed?.details || "").toLowerCase();

  if (parsed?.code === "PGRST205") {
    return true;
  }

  return (
    normalizedError.includes("pgrst205") ||
    normalizedMessage.includes("schema cache") ||
    normalizedMessage.includes("could not find the table") ||
    normalizedDetails.includes("schema cache")
  );
};

const buildGooglePhoneKey = (providerUserId: string): string => {
  const normalized = providerUserId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return `google_${normalized || "user"}`;
};

const ensureDefaultCategoriesForUser = async (
  database: SQLite.SQLiteDatabase,
  userId: number,
): Promise<void> => {
  const expenseCountRow = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM categories WHERE type = 'expense' AND user_id = ?`,
    [userId],
  );
  const incomeCountRow = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM categories WHERE type = 'income' AND user_id = ?`,
    [userId],
  );

  const expenseCount = Number(expenseCountRow?.count || 0);
  const incomeCount = Number(incomeCountRow?.count || 0);

  if (expenseCount === 0) {
    for (const category of DEFAULT_EXPENSE_CATEGORIES) {
      await database.runAsync(
        `INSERT INTO categories (user_id, name, type, icon, color) VALUES (?, ?, 'expense', ?, ?)`,
        [userId, category.name, category.icon, category.color],
      );
    }
  }

  if (incomeCount === 0) {
    for (const category of DEFAULT_INCOME_CATEGORIES) {
      await database.runAsync(
        `INSERT INTO categories (user_id, name, type, icon, color) VALUES (?, ?, 'income', ?, ?)`,
        [userId, category.name, category.icon, category.color],
      );
    }
  }
};

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
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= DB_INIT_MAX_RETRIES; attempt++) {
      try {
        const database = await SQLite.openDatabaseAsync(DB_NAME);
        await initializeSchema(database);
        db = database;
        console.log("Database and Tables initialized successfully");
        return true;
      } catch (error) {
        lastError = error;
        console.error(`Database initialization failed (attempt ${attempt}):`, error);

        if (db) {
          try {
            await db.closeAsync();
          } catch {
            // Ignore close errors on failed handles.
          }
        }
        db = null;

        if (attempt < DB_INIT_MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Database initialization failed");
  })().finally(() => {
    dbInitPromise = null;
  });

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

const syncLocalUser = async (user: User): Promise<void> => {
  const database = await ensureDB();
  const existingByPhone = await database.getFirstAsync<{ id: number }>(
    `SELECT id FROM users WHERE phone = ?`,
    [user.phone],
  );

  await database.withTransactionAsync(async () => {
    if (existingByPhone && existingByPhone.id !== user.id) {
      await database.runAsync(
        `UPDATE transactions SET user_id = ? WHERE user_id = ?`,
        [user.id, existingByPhone.id],
      );
      await database.runAsync(`UPDATE categories SET user_id = ? WHERE user_id = ?`, [
        user.id,
        existingByPhone.id,
      ]);
      await database.runAsync(`UPDATE budgets SET user_id = ? WHERE user_id = ?`, [
        user.id,
        existingByPhone.id,
      ]);
      await database.runAsync(
        `DELETE FROM auth_tokens WHERE user_id IN (?, ?)`,
        [existingByPhone.id, user.id],
      );
      await database.runAsync(`DELETE FROM users WHERE id = ?`, [
        existingByPhone.id,
      ]);
    }

    await database.runAsync(
      `INSERT OR REPLACE INTO users (id, name, phone, password, created_at) VALUES (?, ?, ?, ?, ?)`,
      [user.id, user.name, user.phone, user.password, user.created_at],
    );
  });
};

const createAuthTokenLocal = async (
  userId: number,
): Promise<{ token: string; expiresAt: string } | null> => {
  const database = await ensureDB();
  const token = await generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await database.runAsync(`DELETE FROM auth_tokens WHERE user_id = ?`, [userId]);
  await database.runAsync(
    `INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`,
    [userId, token, expiresAt],
  );
  return { token, expiresAt };
};

const validateTokenLocal = async (
  token: string,
): Promise<{ valid: boolean; user?: User }> => {
  const database = await ensureDB();
  const tokenData = await database.getFirstAsync<{
    user_id: number;
    expires_at: string;
  }>(`SELECT user_id, expires_at FROM auth_tokens WHERE token = ?`, [token]);

  if (!tokenData) {
    return { valid: false };
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    await database.runAsync(`DELETE FROM auth_tokens WHERE token = ?`, [token]);
    return { valid: false };
  }

  const user = await database.getFirstAsync<User>(`SELECT * FROM users WHERE id = ?`, [
    tokenData.user_id,
  ]);
  return user ? { valid: true, user } : { valid: false };
};

const deleteAuthTokenLocal = async (token: string): Promise<boolean> => {
  const database = await ensureDB();
  await database.runAsync(`DELETE FROM auth_tokens WHERE token = ?`, [token]);
  return true;
};

const getUserByIdLocal = async (id: number): Promise<User | null> => {
  const database = await ensureDB();
  const user = await database.getFirstAsync<User>(`SELECT * FROM users WHERE id = ?`, [
    id,
  ]);
  return user || null;
};

const registerUserLocal = async (
  name: string,
  phone: string,
  password: string,
): Promise<{ success: boolean; message: string; userId?: number }> => {
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
};

const loginUserLocal = async (
  phone: string,
  password: string,
): Promise<{
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  expiresAt?: string;
}> => {
  const database = await ensureDB();
  const user = await database.getFirstAsync<User>(
    `SELECT * FROM users WHERE phone = ? AND password = ?`,
    [phone, password],
  );

  if (!user) {
    return { success: false, message: "Invalid phone or password" };
  }

  const tokenData = await createAuthTokenLocal(user.id);
  if (!tokenData) {
    return { success: true, message: "Login successful", user };
  }

  return {
    success: true,
    message: "Login successful",
    user,
    token: tokenData.token,
    expiresAt: tokenData.expiresAt,
  };
};

const checkPhoneExistsLocal = async (phone: string): Promise<boolean> => {
  const database = await ensureDB();
  const user = await database.getFirstAsync<User>(`SELECT id FROM users WHERE phone = ?`, [
    phone,
  ]);
  return !!user;
};

const resetPasswordLocal = async (
  phone: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> => {
  const database = await ensureDB();
  const result = await database.runAsync(
    `UPDATE users SET password = ? WHERE phone = ?`,
    [newPassword, phone],
  );

  if (result.changes > 0) {
    const user = await database.getFirstAsync<User>(`SELECT id FROM users WHERE phone = ?`, [
      phone,
    ]);
    if (user) {
      await database.runAsync(`DELETE FROM auth_tokens WHERE user_id = ?`, [user.id]);
    }
    return { success: true, message: "Password reset successful" };
  }

  return { success: false, message: "User not found" };
};

const changeUserPasswordLocal = async (
  userId: number,
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> => {
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
  await database.runAsync(`DELETE FROM auth_tokens WHERE user_id = ?`, [userId]);

  return { success: true, message: "Password changed successfully" };
};

const updateUserProfileLocal = async (
  userId: number,
  name: string,
): Promise<{ success: boolean; message: string; user?: User }> => {
  const database = await ensureDB();

  await database.runAsync(`UPDATE users SET name = ? WHERE id = ?`, [name, userId]);
  const updatedUser = await getUserByIdLocal(userId);

  if (!updatedUser) {
    return { success: false, message: "Failed to update profile" };
  }

  return {
    success: true,
    message: "Profile updated successfully",
    user: updatedUser,
  };
};

// --- USER AUTHENTICATION ---

export const createAuthToken = async (
  userId: number,
): Promise<{ token: string; expiresAt: string } | null> => {
  try {
    const token = await generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    if (isSupabaseAuthConfigured()) {
      const deleteResponse = await supabaseRequest<unknown>(
        `${SUPABASE_TOKENS_TABLE}?user_id=eq.${userId}`,
        { method: "DELETE" },
      );

      if (
        deleteResponse.ok ||
        deleteResponse.status === 404 ||
        shouldFallbackToLocalAuth(deleteResponse.status, deleteResponse.error)
      ) {
        const insertResponse = await supabaseRequest<Array<{ token: string; expires_at: string }>>(
          `${SUPABASE_TOKENS_TABLE}?select=token,expires_at`,
          {
            method: "POST",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify([{ user_id: userId, token, expires_at: expiresAt }]),
          },
        );

        if (insertResponse.ok) {
          return { token, expiresAt };
        }

        if (shouldFallbackToLocalAuth(insertResponse.status, insertResponse.error)) {
          return await createAuthTokenLocal(userId);
        }
      }

      if (
        deleteResponse.status > 0 &&
        !shouldFallbackToLocalAuth(deleteResponse.status, deleteResponse.error)
      ) {
        return null;
      }
    }

    return await createAuthTokenLocal(userId);
  } catch (error) {
    console.error("Create token error:", error);
    return null;
  }
};

export const validateToken = async (
  token: string,
): Promise<{ valid: boolean; user?: User }> => {
  try {
    if (isSupabaseAuthConfigured()) {
      const response = await supabaseRequest<Array<{ user_id: number; expires_at: string }>>(
        `${SUPABASE_TOKENS_TABLE}?token=eq.${encodeURIComponent(
          token,
        )}&select=user_id,expires_at&limit=1`,
      );

      if (response.ok && response.data?.length) {
        const tokenData = response.data[0];
        if (new Date(tokenData.expires_at) < new Date()) {
          await supabaseRequest<unknown>(
            `${SUPABASE_TOKENS_TABLE}?token=eq.${encodeURIComponent(token)}`,
            { method: "DELETE" },
          );
          return { valid: false };
        }

        const user = await getUserById(tokenData.user_id);
        return user ? { valid: true, user } : { valid: false };
      }

      if (response.status > 0 && !shouldFallbackToLocalAuth(response.status, response.error)) {
        return { valid: false };
      }
    }

    return await validateTokenLocal(token);
  } catch (error) {
    console.error("Validate token error:", error);
    return { valid: false };
  }
};

export const deleteAuthToken = async (token: string): Promise<boolean> => {
  try {
    if (isSupabaseAuthConfigured()) {
      const response = await supabaseRequest<unknown>(
        `${SUPABASE_TOKENS_TABLE}?token=eq.${encodeURIComponent(token)}`,
        { method: "DELETE" },
      );
      if (response.ok || response.status === 404) {
        return true;
      }

      if (response.status > 0 && !shouldFallbackToLocalAuth(response.status, response.error)) {
        return false;
      }
    }

    return await deleteAuthTokenLocal(token);
  } catch (error) {
    console.error("Delete token error:", error);
    return false;
  }
};

export const registerUser = async (
  name: string,
  phone: string,
  password: string,
): Promise<{ success: boolean; message: string; userId?: number }> => {
  try {
    if (isSupabaseAuthConfigured()) {
      const existing = await supabaseRequest<Array<{ id: number | string }>>(
        `${SUPABASE_USERS_TABLE}?phone=eq.${encodeURIComponent(phone)}&select=id&limit=1`,
      );

      if (
        !existing.ok &&
        existing.status > 0 &&
        !shouldFallbackToLocalAuth(existing.status, existing.error)
      ) {
        return {
          success: false,
          message: getSupabaseErrorMessage(existing.error, "Registration failed"),
        };
      }

      if (existing.ok && existing.data?.length) {
        return { success: false, message: "Phone number already registered" };
      }

      const create = await supabaseRequest<Array<User>>(
        `${SUPABASE_USERS_TABLE}?select=id,name,phone,password,created_at`,
        {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify([{ name, phone, password }]),
        },
      );

      if (create.ok && create.data?.length) {
        const user = toUser(create.data[0]);
        await syncLocalUser(user);
        return { success: true, message: "Registration successful", userId: user.id };
      }

      if (
        !create.ok &&
        create.status > 0 &&
        !shouldFallbackToLocalAuth(create.status, create.error)
      ) {
        return {
          success: false,
          message: getSupabaseErrorMessage(create.error, "Registration failed"),
        };
      }
    }

    return await registerUserLocal(name, phone, password);
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
    if (isSupabaseAuthConfigured()) {
      const response = await supabaseRequest<Array<User>>(
        `${SUPABASE_USERS_TABLE}?phone=eq.${encodeURIComponent(
          phone,
        )}&password=eq.${encodeURIComponent(
          password,
        )}&select=id,name,phone,password,created_at&limit=1`,
      );

      if (response.ok && response.data?.length) {
        const user = toUser(response.data[0]);
        await syncLocalUser(user);
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
      }

      if (
        !response.ok &&
        response.status > 0 &&
        !shouldFallbackToLocalAuth(response.status, response.error)
      ) {
        return {
          success: false,
          message: getSupabaseErrorMessage(response.error, "Login failed"),
        };
      }

      if (response.ok && !response.data?.length) {
        return { success: false, message: "Invalid phone or password" };
      }
    }

    return await loginUserLocal(phone, password);
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "Login failed" };
  }
};

export const loginWithGoogleIdentity = async (
  payload: GoogleIdentityPayload,
): Promise<{
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  expiresAt?: string;
}> => {
  try {
    const phoneKey = buildGooglePhoneKey(payload.providerUserId);
    const displayName =
      payload.name?.trim() ||
      payload.email?.trim() ||
      "Google User";
    const oauthPassword = `oauth_google_${payload.providerUserId}`;

    if (isSupabaseAuthConfigured()) {
      const existing = await supabaseRequest<Array<User>>(
        `${SUPABASE_USERS_TABLE}?phone=eq.${encodeURIComponent(
          phoneKey,
        )}&select=id,name,phone,password,created_at&limit=1`,
      );

      if (
        !existing.ok &&
        existing.status > 0 &&
        !shouldFallbackToLocalAuth(existing.status, existing.error)
      ) {
        return {
          success: false,
          message: getSupabaseErrorMessage(existing.error, "Google login failed"),
        };
      }

      let user: User | null = null;
      if (existing.ok && existing.data?.length) {
        user = toUser(existing.data[0]);
      } else {
        const create = await supabaseRequest<Array<User>>(
          `${SUPABASE_USERS_TABLE}?select=id,name,phone,password,created_at`,
          {
            method: "POST",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify([
              { name: displayName, phone: phoneKey, password: oauthPassword },
            ]),
          },
        );

        if (
          !create.ok &&
          create.status > 0 &&
          !shouldFallbackToLocalAuth(create.status, create.error)
        ) {
          return {
            success: false,
            message: getSupabaseErrorMessage(create.error, "Google login failed"),
          };
        }

        if (create.ok && create.data?.length) {
          user = toUser(create.data[0]);
        }
      }

      if (user) {
        await syncLocalUser(user);
        const tokenData = await createAuthToken(user.id);
        if (!tokenData) {
          return {
            success: false,
            message: "Google login failed: unable to create session token.",
          };
        }
        return {
          success: true,
          message: "Login successful",
          user,
          token: tokenData.token,
          expiresAt: tokenData.expiresAt,
        };
      }
    }

    const database = await ensureDB();
    let user = await database.getFirstAsync<User>(
      `SELECT * FROM users WHERE phone = ? LIMIT 1`,
      [phoneKey],
    );

    if (!user) {
      const result = await database.runAsync(
        `INSERT INTO users (name, phone, password) VALUES (?, ?, ?)`,
        [displayName, phoneKey, oauthPassword],
      );
      const newUserId = Number(result.lastInsertRowId);
      user = await getUserByIdLocal(newUserId);
    }

    if (!user) {
      return { success: false, message: "Google login failed." };
    }

    const tokenData = await createAuthTokenLocal(user.id);
    if (!tokenData) {
      return { success: false, message: "Google login failed: unable to create session token." };
    }

    return {
      success: true,
      message: "Login successful",
      user,
      token: tokenData.token,
      expiresAt: tokenData.expiresAt,
    };
  } catch (error) {
    console.error("Google login error:", error);
    return {
      success: false,
      message: "Google login failed.",
    };
  }
};

export const getUserById = async (id: number): Promise<User | null> => {
  try {
    if (isSupabaseAuthConfigured()) {
      const response = await supabaseRequest<Array<User>>(
        `${SUPABASE_USERS_TABLE}?id=eq.${id}&select=id,name,phone,password,created_at&limit=1`,
      );
      if (response.ok && response.data?.length) {
        const user = toUser(response.data[0]);
        await syncLocalUser(user);
        return user;
      }

      if (response.status > 0 && !shouldFallbackToLocalAuth(response.status, response.error)) {
        return null;
      }
    }

    return await getUserByIdLocal(id);
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
};

export const checkPhoneExists = async (phone: string): Promise<boolean> => {
  try {
    if (isSupabaseAuthConfigured()) {
      const response = await supabaseRequest<Array<{ id: number }>>(
        `${SUPABASE_USERS_TABLE}?phone=eq.${encodeURIComponent(phone)}&select=id&limit=1`,
      );
      if (response.ok) {
        return !!response.data?.length;
      }

      if (response.status > 0 && !shouldFallbackToLocalAuth(response.status, response.error)) {
        return false;
      }
    }

    return await checkPhoneExistsLocal(phone);
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
    if (isSupabaseAuthConfigured()) {
      const update = await supabaseRequest<Array<User>>(
        `${SUPABASE_USERS_TABLE}?phone=eq.${encodeURIComponent(
          phone,
        )}&select=id,name,phone,password,created_at`,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ password: newPassword }),
        },
      );

      if (update.ok && update.data?.length) {
        const user = toUser(update.data[0]);
        await syncLocalUser(user);
        await supabaseRequest<unknown>(
          `${SUPABASE_TOKENS_TABLE}?user_id=eq.${user.id}`,
          {
            method: "DELETE",
          },
        );
        const database = await ensureDB();
        await database.runAsync(`DELETE FROM auth_tokens WHERE user_id = ?`, [
          user.id,
        ]);
        return { success: true, message: "Password reset successful" };
      }

      if (
        !update.ok &&
        update.status > 0 &&
        !shouldFallbackToLocalAuth(update.status, update.error)
      ) {
        return {
          success: false,
          message: getSupabaseErrorMessage(update.error, "Password reset failed"),
        };
      }

      if (update.ok && !update.data?.length) {
        return { success: false, message: "User not found" };
      }
    }

    return await resetPasswordLocal(phone, newPassword);
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
    if (isSupabaseAuthConfigured()) {
      const userResponse = await supabaseRequest<Array<User>>(
        `${SUPABASE_USERS_TABLE}?id=eq.${userId}&password=eq.${encodeURIComponent(
          currentPassword,
        )}&select=id,name,phone,password,created_at&limit=1`,
      );

      if (userResponse.ok && !userResponse.data?.length) {
        return { success: false, message: "Current password is incorrect" };
      }

      if (userResponse.ok && userResponse.data?.length) {
        const update = await supabaseRequest<Array<User>>(
          `${SUPABASE_USERS_TABLE}?id=eq.${userId}&select=id,name,phone,password,created_at`,
          {
            method: "PATCH",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify({ password: newPassword }),
          },
        );

        if (update.ok && update.data?.length) {
          await syncLocalUser(toUser(update.data[0]));
          await supabaseRequest<unknown>(`${SUPABASE_TOKENS_TABLE}?user_id=eq.${userId}`, {
            method: "DELETE",
          });
          const database = await ensureDB();
          await database.runAsync(`DELETE FROM auth_tokens WHERE user_id = ?`, [userId]);
          return { success: true, message: "Password changed successfully" };
        }

        if (
          !update.ok &&
          update.status > 0 &&
          !shouldFallbackToLocalAuth(update.status, update.error)
        ) {
          return {
            success: false,
            message: getSupabaseErrorMessage(update.error, "Failed to change password"),
          };
        }
      }

      if (
        !userResponse.ok &&
        userResponse.status > 0 &&
        !shouldFallbackToLocalAuth(userResponse.status, userResponse.error)
      ) {
        return {
          success: false,
          message: getSupabaseErrorMessage(userResponse.error, "Failed to change password"),
        };
      }
    }

    return await changeUserPasswordLocal(userId, currentPassword, newPassword);
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
    if (isSupabaseAuthConfigured()) {
      const update = await supabaseRequest<Array<User>>(
        `${SUPABASE_USERS_TABLE}?id=eq.${userId}&select=id,name,phone,password,created_at`,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ name }),
        },
      );

      if (update.ok && update.data?.length) {
        const user = toUser(update.data[0]);
        await syncLocalUser(user);
        return {
          success: true,
          message: "Profile updated successfully",
          user,
        };
      }

      if (
        !update.ok &&
        update.status > 0 &&
        !shouldFallbackToLocalAuth(update.status, update.error)
      ) {
        return {
          success: false,
          message: getSupabaseErrorMessage(update.error, "Failed to update profile"),
        };
      }
    }

    return await updateUserProfileLocal(userId, name);
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
  const hasUserScope = userId !== undefined && userId !== null;

  let rows: TransactionRecord[];
  if (hasUserScope) {
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
  const hasUserScope = userId !== undefined && userId !== null;

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

  if (hasUserScope) {
    await ensureDefaultCategoriesForUser(database, userId as number);
  }

  // New schema with user_id
  if (type && hasUserScope) {
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
  if (hasUserScope) {
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
  if (userId !== undefined && userId !== null) {
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
    database.getAllAsync<{
      id: number;
      user_id?: number;
      name: string;
      type: string;
      icon: string;
      color: string;
    }>(
      `SELECT id, user_id, name, type, icon, color FROM categories WHERE user_id = ?`,
      [userId],
    ),
    database.getAllAsync<{
      id: number;
      user_id?: number;
      category: string;
      limit_amount: number;
    }>(
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
