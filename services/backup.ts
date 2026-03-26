import {
  getUserBackupPayload,
  restoreUserDataFromBackup,
  UserBackupPayload,
} from "@/services/db";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

interface SupabaseConfig {
  url?: string;
  anonKey?: string;
}

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

const missingTableHelp =
  "Supabase table missing. Create table public.user_backups (id bigint identity primary key, user_id bigint not null, backup_data jsonb not null, created_at timestamptz default now()).";
const LOCAL_BACKUP_PREFIX = "localBackupSnapshot";

const getLocalBackupKey = (userId: number) =>
  `${LOCAL_BACKUP_PREFIX}:${userId}`;

const parseSupabaseError = (text: string): string => {
  if (!text) return "Unknown error";
  if (text.includes("PGRST205") || text.includes("user_backups")) {
    return missingTableHelp;
  }
  return text;
};

const isValidBackupPayload = (data: unknown): data is UserBackupPayload => {
  if (!data || typeof data !== "object") return false;
  const candidate = data as UserBackupPayload;
  return (
    Array.isArray(candidate.transactions) &&
    Array.isArray(candidate.categories) &&
    Array.isArray(candidate.budgets)
  );
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
    const hasTransactions = (payload.transactions?.length || 0) > 0;
    const hasBudgets = (payload.budgets?.length || 0) > 0;

    if (!hasTransactions && !hasBudgets) {
      return {
        success: false,
        message:
          "Nothing to backup yet. Add a transaction or budget before running backup.",
      };
    }
    await AsyncStorage.setItem(
      getLocalBackupKey(userId),
      JSON.stringify(payload),
    );

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
      if (
        errorText.includes("PGRST205") ||
        errorText.includes("user_backups")
      ) {
        return await backupUserDataLocally(userId, payload);
      }
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
        error instanceof Error
          ? error.message
          : "Backup failed due to an unexpected error.",
    };
  }
};

const backupUserDataLocally = async (
  userId: number,
  payload?: UserBackupPayload,
) => {
  try {
    const shareAvailable = await Sharing.isAvailableAsync();
    if (!shareAvailable) {
      return {
        success: false,
        message:
          "Supabase table is missing and local share is unavailable on this device.",
      };
    }

    const backup = payload ?? (await getUserBackupPayload(userId));
    await AsyncStorage.setItem(
      getLocalBackupKey(userId),
      JSON.stringify(backup),
    );
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const uri = `${FileSystem.cacheDirectory}MoneyMaster-backup-${userId}-${timestamp}.json`;
    await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await Sharing.shareAsync(uri, {
      mimeType: "application/json",
      dialogTitle: "Backup Data",
      UTI: "public.json",
    });

    return {
      success: true,
      message:
        "Supabase backup table was missing, so a local backup file was exported instead.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create local backup file.",
    };
  }
};

const restoreFromLocalBackup = async (userId: number) => {
  try {
    const snapshot = await AsyncStorage.getItem(getLocalBackupKey(userId));
    if (!snapshot) {
      return {
        success: false,
        message:
          "No cloud backup table found and no local backup snapshot exists yet. Run Backup Data once first.",
      };
    }

    const parsed = JSON.parse(snapshot) as UserBackupPayload;
    const restored = await restoreUserDataFromBackup(userId, parsed);
    if (!restored) {
      return {
        success: false,
        message: "Local backup found, but restore failed.",
      };
    }

    return {
      success: true,
      message:
        "Supabase table is missing, restored successfully from local backup snapshot.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to restore from local backup snapshot.",
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
    [];
    if (!response.ok) {
      const errorText = await response.text();
      if (
        errorText.includes("PGRST205") ||
        errorText.includes("user_backups")
      ) {
        return await restoreFromLocalBackup(userId);
      }
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

    const restored = await restoreUserDataFromBackup(
      userId,
      rows[0].backup_data,
    );
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
        error instanceof Error
          ? error.message
          : "Restore failed due to an unexpected error.",
    };
  }
};

export const importBackupFromJsonFile = async (userId: number) => {
  try {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ["application/json", "text/json", "*/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (picked.canceled || !picked.assets?.length) {
      return { success: false, message: "Import cancelled." };
    }

    const file = picked.assets[0];
    const raw = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const parsed = JSON.parse(raw) as
      | UserBackupPayload
      | { backup_data?: UserBackupPayload };
    const payload =
      (parsed as { backup_data?: UserBackupPayload })?.backup_data || parsed;

    if (!isValidBackupPayload(payload)) {
      return {
        success: false,
        message:
          "Invalid backup file. Expected a MoneyMaster backup JSON with transactions, categories, and budgets.",
      };
    }

    const restored = await restoreUserDataFromBackup(userId, payload);
    if (!restored) {
      return {
        success: false,
        message: "Backup file is valid, but restore failed.",
      };
    }

    await AsyncStorage.setItem(
      getLocalBackupKey(userId),
      JSON.stringify(payload),
    );
    return {
      success: true,
      message: "Backup file imported and restored successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to import backup file.",
    };
  }
};
