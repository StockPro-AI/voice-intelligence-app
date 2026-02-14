import { eq, and, or } from "drizzle-orm";
import { tasks, type Task, type InsertTask } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Create a new task
 */
export async function createTask(userId: number, data: Omit<InsertTask, "userId">): Promise<Task | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(tasks).values({
      ...data,
      userId,
    });

    const inserted = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, result[0].insertId as number))
      .limit(1);

    return inserted[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create task:", error);
    return null;
  }
}

/**
 * Get all tasks for a user with optional filters
 */
export async function getUserTasks(
  userId: number,
  filters?: {
    status?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }
): Promise<Task[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    let whereCondition = eq(tasks.userId, userId);

    if (filters?.status && filters?.priority) {
      whereCondition = and(
        eq(tasks.userId, userId),
        eq(tasks.status, filters.status as any),
        eq(tasks.priority, filters.priority as any)
      ) as any;
    } else if (filters?.status) {
      whereCondition = and(
        eq(tasks.userId, userId),
        eq(tasks.status, filters.status as any)
      ) as any;
    } else if (filters?.priority) {
      whereCondition = and(
        eq(tasks.userId, userId),
        eq(tasks.priority, filters.priority as any)
      ) as any;
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    return await db
      .select()
      .from(tasks)
      .where(whereCondition)
      .orderBy(tasks.createdAt)
      .limit(limit)
      .offset(offset);
  } catch (error) {
    console.error("[Database] Failed to get user tasks:", error);
    return [];
  }
}

/**
 * Get tasks sorted by priority (Magic Sort)
 */
export async function getTasksSortedByPriority(
  userId: number,
  includeCompleted: boolean = false
): Promise<Task[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    let whereCondition = eq(tasks.userId, userId);

    if (!includeCompleted) {
      // Get only todo and in_progress tasks
      whereCondition = and(
        eq(tasks.userId, userId),
        or(
          eq(tasks.status, "todo" as any),
          eq(tasks.status, "in_progress" as any)
        )
      ) as any;
    }

    const userTasks = await db
      .select()
      .from(tasks)
      .where(whereCondition)
      .orderBy(tasks.createdAt);

    // Sort by priority: critical > high > medium > low
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return userTasks.sort(
      (a, b) =>
        (priorityOrder[a.priority] || 99) -
        (priorityOrder[b.priority] || 99)
    );
  } catch (error) {
    console.error("[Database] Failed to get sorted tasks:", error);
    return [];
  }
}

/**
 * Update a task
 */
export async function updateTask(
  taskId: number,
  userId: number,
  data: Partial<Omit<Task, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<Task | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Verify ownership
    const task = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (!task.length) return null;

    const updateData: Record<string, unknown> = { ...data };

    // Mark as completed if status is done
    if (data.status === "done") {
      updateData.completedAt = new Date();
    }

    await db.update(tasks).set(updateData).where(eq(tasks.id, taskId));

    const updated = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    return updated[0] || null;
  } catch (error) {
    console.error("[Database] Failed to update task:", error);
    return null;
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Verify ownership
    const task = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (!task.length) return false;

    await db.delete(tasks).where(eq(tasks.id, taskId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete task:", error);
    return false;
  }
}

/**
 * Get task by ID
 */
export async function getTaskById(taskId: number, userId: number): Promise<Task | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const task = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    return task[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get task:", error);
    return null;
  }
}
