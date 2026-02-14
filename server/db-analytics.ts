import { eq, and, gte, lte } from "drizzle-orm";
import { recordingHistory, tasks, weeklyAnalysis, type WeeklyAnalysis } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Get recordings for a specific week
 */
export async function getWeekRecordings(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  try {
    const recordings = await db
      .select()
      .from(recordingHistory)
      .where(
        and(
          eq(recordingHistory.userId, userId),
          gte(recordingHistory.createdAt, startDate),
          lte(recordingHistory.createdAt, endDate)
        )
      )
      .orderBy(recordingHistory.createdAt);

    return recordings;
  } catch (error) {
    console.error("[Database] Failed to get week recordings:", error);
    return [];
  }
}

/**
 * Get tasks completed in a specific week
 */
export async function getWeekCompletedTasks(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  try {
    const completedTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.status, "done"),
          gte(tasks.completedAt, startDate),
          lte(tasks.completedAt, endDate)
        )
      )
      .orderBy(tasks.completedAt);

    return completedTasks;
  } catch (error) {
    console.error("[Database] Failed to get week completed tasks:", error);
    return [];
  }
}

/**
 * Calculate productivity metrics for a week
 */
export async function calculateWeekMetrics(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return null;

  try {
    const recordings = await getWeekRecordings(userId, startDate, endDate);
    const completedTasks = await getWeekCompletedTasks(userId, startDate, endDate);

    // Calculate total recording time
    const totalRecordingTime = recordings.reduce((sum, rec) => {
      return sum + (rec.duration || 0);
    }, 0);

    // Calculate average recording duration
    const avgRecordingDuration = recordings.length > 0 ? totalRecordingTime / recordings.length : 0;

    // Count recordings by day
    const recordingsByDay: Record<string, number> = {};
    recordings.forEach((rec) => {
      const day = rec.createdAt.toISOString().split("T")[0];
      recordingsByDay[day] = (recordingsByDay[day] || 0) + 1;
    });

    // Count tasks by priority
    const tasksByPriority: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    completedTasks.forEach((task) => {
      tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1;
    });

    return {
      totalRecordings: recordings.length,
      totalRecordingTime,
      avgRecordingDuration,
      completedTasks: completedTasks.length,
      recordingsByDay,
      tasksByPriority,
      startDate,
      endDate,
    };
  } catch (error) {
    console.error("[Database] Failed to calculate week metrics:", error);
    return null;
  }
}

/**
 * Extract topics from recordings (simple keyword extraction)
 */
export function extractTopics(recordings: typeof recordingHistory.$inferSelect[]): Record<string, number> {
  const topics: Record<string, number> = {};

  recordings.forEach((rec) => {
    if (rec.transcription) {
      // Simple keyword extraction - split by common delimiters
      const words = rec.transcription
        .toLowerCase()
        .split(/[\s,;:.!?()[\]{}'"]+/)
        .filter((word) => word.length > 3); // Only words > 3 chars

      // Count word frequencies (simple approach)
      words.forEach((word) => {
        // Filter out common stop words
        if (!["the", "and", "that", "this", "with", "from", "have", "been", "were", "will", "would", "could", "should", "about", "which", "their", "there", "where", "when", "what", "who", "why", "how"].includes(word)) {
          topics[word] = (topics[word] || 0) + 1;
        }
      });
    }
  });

  // Sort by frequency and return top 10
  return Object.fromEntries(
    Object.entries(topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  );
}

/**
 * Save weekly analysis to database
 */
export async function saveWeeklyAnalysis(
  userId: number,
  data: {
    weekStartDate: Date;
    summary: string;
    topThemes: string;
    projectIdeas: string;
    recommendations: string;
    recordingCount: number;
  }
): Promise<WeeklyAnalysis | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(weeklyAnalysis).values({
      userId,
      weekStartDate: data.weekStartDate,
      summary: data.summary,
      topThemes: data.topThemes,
      projectIdeas: data.projectIdeas,
      recommendations: data.recommendations,
      recordingCount: data.recordingCount,
    });

    const inserted = await db
      .select()
      .from(weeklyAnalysis)
      .where(eq(weeklyAnalysis.id, result[0].insertId as number))
      .limit(1);

    return inserted[0] || null;
  } catch (error) {
    console.error("[Database] Failed to save weekly analysis:", error);
    return null;
  }
}

/**
 * Get latest weekly analysis
 */
export async function getLatestWeeklyAnalysis(userId: number): Promise<WeeklyAnalysis | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const analysis = await db
      .select()
      .from(weeklyAnalysis)
      .where(eq(weeklyAnalysis.userId, userId))
      .orderBy(weeklyAnalysis.weekStartDate)
      .limit(1);

    return analysis[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get latest weekly analysis:", error);
    return null;
  }
}

/**
 * Get weekly analyses for a date range
 */
export async function getWeeklyAnalysesByRange(
  userId: number,
  startDate: Date,
  endDate: Date,
  limit = 12
): Promise<WeeklyAnalysis[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const analyses = await db
      .select()
      .from(weeklyAnalysis)
      .where(
        and(
          eq(weeklyAnalysis.userId, userId),
          gte(weeklyAnalysis.weekStartDate, startDate),
          lte(weeklyAnalysis.weekStartDate, endDate)
        )
      )
      .orderBy(weeklyAnalysis.weekStartDate)
      .limit(limit);

    return analyses;
  } catch (error) {
    console.error("[Database] Failed to get weekly analyses:", error);
    return [];
  }
}

/**
 * Calculate week start and end dates
 */
export function getWeekBoundaries(date: Date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday

  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}
