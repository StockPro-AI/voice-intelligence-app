import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});



export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Supported languages for transcription
export const TRANSCRIPTION_LANGUAGES = {
  en: "English",
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
  ru: "Russian",
  ja: "Japanese",
  zh: "Chinese",
} as const;

export type TranscriptionLanguage = keyof typeof TRANSCRIPTION_LANGUAGES;

export const userSettings = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  globalHotkey: varchar("globalHotkey", { length: 64 }).default("Alt+Shift+V").notNull(),
  transcriptionLanguage: varchar("transcriptionLanguage", { length: 10 }).default("en").notNull(),
  enrichmentMode: mysqlEnum("enrichmentMode", ["summary", "structure", "format", "context"]).default("summary").notNull(),
  autoEnrich: boolean("autoEnrich").default(false).notNull(),
  darkMode: boolean("darkMode").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

// Recording history for tracking all voice recordings and their enrichments
export const recordingHistory = mysqlTable("recording_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  audioUrl: varchar("audioUrl", { length: 512 }).notNull(),
  transcription: text("transcription").notNull(),
  enrichedResult: text("enrichedResult"),
  enrichmentMode: mysqlEnum("enrichmentMode", ["summary", "structure", "format", "context"]),
  transcriptionLanguage: varchar("transcriptionLanguage", { length: 10 }).notNull(),
  duration: int("duration"),
  isFavorite: boolean("isFavorite").default(false).notNull(),
  title: varchar("title", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RecordingHistory = typeof recordingHistory.$inferSelect;
export type InsertRecordingHistory = typeof recordingHistory.$inferInsert;

// Favorites for quick access to enrichment mode combinations
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  enrichmentMode: mysqlEnum("enrichmentMode", ["summary", "structure", "format", "context"]).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

// Task management for extracted tasks from recordings
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  recordingId: int("recordingId"), // Reference to recording that generated this task
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  status: mysqlEnum("status", ["todo", "in_progress", "done", "cancelled"]).default("todo").notNull(),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  tags: varchar("tags", { length: 500 }), // JSON array as string
  extractedFrom: text("extractedFrom"), // Original text that generated this task
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// Chat history for "Ask your Note" feature
export const chatHistory = mysqlTable("chat_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  recordingId: int("recordingId"), // Reference to recording being discussed
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"), // JSON for additional context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatHistory = typeof chatHistory.$inferSelect;
export type InsertChatHistory = typeof chatHistory.$inferInsert;

// Weekly analysis results
export const weeklyAnalysis = mysqlTable("weekly_analysis", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  weekStartDate: timestamp("weekStartDate").notNull(),
  summary: text("summary").notNull(), // Main insights
  topThemes: varchar("topThemes", { length: 500 }), // JSON array
  projectIdeas: text("projectIdeas"), // Generated project ideas
  recommendations: text("recommendations"), // Actionable recommendations
  recordingCount: int("recordingCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WeeklyAnalysis = typeof weeklyAnalysis.$inferSelect;
export type InsertWeeklyAnalysis = typeof weeklyAnalysis.$inferInsert;
