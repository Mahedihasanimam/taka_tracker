import Constants from "expo-constants";
import { getUserBackupPayload, restoreUserDataFromBackup, UserBackupPayload } from "@/services/db";

interface SupabaseConfig {
  url?: string;
  anonKey?: string;
}

const getSupabaseConfig = (): SupabaseConfig => {
  const extra = (Constants.expoConfig?.extra || {}) as {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
  };

  return {
    url: extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_KEY,
  };
};

const missingTableHelp =
  "Supabase table missing. Create table public.user_backups (id bigint identity primary key, user_id bigint not null, backup_data jsonb not null, created_at timestamptz default now()).";

const parseSupabaseError = (text: string): string => {
  if (!text) return "Unknown error";
  if (text.includes("PGRST205") || text.includes("user_backups")) {
    return missingTableHelp;
  }
  return text;
};

export const backupUserDataToSupabase = async (userId: number) => {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    return {
      success: false,
      message:
        "Supabase is not configured. Add expo.extra.supabaseUrl and expo.extra.supabaseAnonKey in app.json.",
    };
  }

  try {
    const payload = await getUserBackupPayload(userId);

    const response = await fetch(`${url}/rest/v1/user_backups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        user_id: userId,
        backup_data: payload,
        created_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `Backup failed (${response.status}): ${parseSupabaseError(errorText)}`,
      };
    }

    return {
      success: true,
      message: "Backup completed successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Backup failed due to an unexpected error.",
    };
  }
};

export const restoreLatestUserBackupFromSupabase = async (userId: number) => {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    return {
      success: false,
      message:
        "Supabase is not configured. Add expo.extra.supabaseUrl and expo.extra.supabaseAnonKey in app.json.",
    };
  }

  try {
    const query = `${url}/rest/v1/user_backups?user_id=eq.${userId}&select=backup_data,created_at&order=created_at.desc&limit=1`;
    const response = await fetch(query, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `Restore failed (${response.status}): ${parseSupabaseError(errorText)}`,
      };
    }

    const rows = (await response.json()) as Array<{
      backup_data: UserBackupPayload;
      created_at: string;
    }>;

    if (!rows.length || !rows[0]?.backup_data) {
      return {
        success: false,
        message: "No backup found for this account.",
      };
    }

    const restored = await restoreUserDataFromBackup(userId, rows[0].backup_data);
    if (!restored) {
      return {
        success: false,
        message: "Backup found, but failed to restore data locally.",
      };
    }

    return {
      success: true,
      message: "Restore completed successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Restore failed due to an unexpected error.",
    };
  }
};
