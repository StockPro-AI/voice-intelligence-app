import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, InsertUserSettings, InsertRecordingHistory, users, userSettings, recordingHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get settings: database not available");
    return undefined;
  }

  try {
    const result = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (result.length > 0) {
      return result[0];
    }

    // Create default settings if not exists
    await db.insert(userSettings).values({
      userId,
      globalHotkey: "Alt+Shift+V",
      transcriptionLanguage: "en",
      enrichmentMode: "summary",
      autoEnrich: false,
      darkMode: true,
    });

    return await getUserSettings(userId);
  } catch (error) {
    console.error("[Database] Failed to get user settings:", error);
    return undefined;
  }
}

export async function updateUserSettings(
  userId: number,
  settings: Partial<InsertUserSettings>
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update settings: database not available");
    return undefined;
  }

  try {
    await db
      .update(userSettings)
      .set(settings)
      .where(eq(userSettings.userId, userId));

    return await getUserSettings(userId);
  } catch (error) {
    console.error("[Database] Failed to update user settings:", error);
    throw error;
  }
}

// Recording History Functions
export async function createRecordingHistory(
  userId: number,
  data: Omit<InsertRecordingHistory, 'userId'>
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create recording: database not available");
    return undefined;
  }

  try {
    const result = await db.insert(recordingHistory).values({
      ...data,
      userId,
    });
    return result;
  } catch (error) {
    console.error("[Database] Failed to create recording:", error);
    throw error;
  }
}

export async function getRecordingHistory(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get recordings: database not available");
    return [];
  }

  try {
    const results = await db
      .select()
      .from(recordingHistory)
      .where(eq(recordingHistory.userId, userId))
      .orderBy(desc(recordingHistory.createdAt))
      .limit(limit)
      .offset(offset);
    return results;
  } catch (error) {
    console.error("[Database] Failed to get recordings:", error);
    return [];
  }
}

export async function getRecordingById(id: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get recording: database not available");
    return undefined;
  }

  try {
    const result = await db
      .select()
      .from(recordingHistory)
      .where(and(eq(recordingHistory.id, id), eq(recordingHistory.userId, userId)))
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get recording:", error);
    return undefined;
  }
}

export async function updateRecording(
  id: number,
  userId: number,
  data: Partial<InsertRecordingHistory>
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update recording: database not available");
    return undefined;
  }

  try {
    await db
      .update(recordingHistory)
      .set(data)
      .where(and(eq(recordingHistory.id, id), eq(recordingHistory.userId, userId)));
    return await getRecordingById(id, userId);
  } catch (error) {
    console.error("[Database] Failed to update recording:", error);
    throw error;
  }
}

export async function deleteRecording(id: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete recording: database not available");
    return false;
  }

  try {
    await db
      .delete(recordingHistory)
      .where(and(eq(recordingHistory.id, id), eq(recordingHistory.userId, userId)));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete recording:", error);
    return false;
  }
}

export async function toggleFavorite(id: number, userId: number, isFavorite: boolean) {
  return updateRecording(id, userId, { isFavorite });
}
