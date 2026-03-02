import { getDb } from "../db";
import { notes, tasks, projects, categorizationFeedback } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

export interface SchedulerJob {
  id: string;
  userId: number;
  type: "categorize" | "analyze" | "extract";
  status: "pending" | "running" | "completed" | "failed";
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

interface CategorizationResult {
  noteId: number;
  category: "raw" | "task" | "project" | "idea";
  confidence: number;
  reasoning: string;
  suggestedTask?: {
    title: string;
    description: string;
    priority: "low" | "medium" | "high" | "critical";
  };
  suggestedProject?: {
    title: string;
    description: string;
    effortLevel: "low" | "medium" | "high";
    potentialImpact: number;
  };
  requiresReview: boolean;
  reviewReason?: string;
}

/**
 * Kategorisiert eine Notiz automatisch mit KI-Analyse
 */
export async function categorizeNote(
  userId: number,
  noteId: number,
  content: string,
  title?: string
): Promise<CategorizationResult> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Konvertiere content zu String
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);

    // Hole Feedback-Historie für diesen Benutzer
    const feedbackHistory = await db
      .select()
      .from(categorizationFeedback)
      .where(eq(categorizationFeedback.userId, userId))
      .limit(10);

    // Erstelle Kontext aus Feedback-Historie
    const feedbackContext = feedbackHistory
      .map(
        (fb) =>
          `Original: ${fb.originalCategory}, Suggested: ${fb.suggestedCategory}, User Feedback: ${fb.userFeedback}${fb.userCorrection ? `, Correction: ${fb.userCorrection}` : ""}`
      )
      .join("\n");

    // KI-Analyse
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Du bist ein intelligenter Notiz-Kategorisierungs-Assistent. Analysiere Notizen und kategorisiere sie in:
- "raw": Rohe Gedanken/Notizen ohne klare Struktur
- "task": Konkrete Aufgaben mit Aktion
- "project": Projekt-Ideen oder längerfristige Ziele
- "idea": Konzepte, Ideen oder Brainstorming

Benutzer-Feedback-Historie (zum Lernen):
${feedbackContext || "Keine Historie vorhanden"}

Antworte mit JSON:
{
  "category": "task|project|idea|raw",
  "confidence": 0-100,
  "reasoning": "Begründung",
  "suggestedTask": null | { "title": "...", "description": "...", "priority": "low|medium|high|critical" },
  "suggestedProject": null | { "title": "...", "description": "...", "effortLevel": "low|medium|high", "potentialImpact": 0-100 },
  "requiresReview": boolean,
  "reviewReason": "optional"
}`,
        },
        {
          role: "user",
          content: `Analysiere diese Notiz:\nTitel: ${title || "Keine Titel"}\nInhalt: ${typeof content === 'string' ? content : JSON.stringify(content)}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "categorization_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: ["raw", "task", "project", "idea"],
              },
              confidence: { type: "number", minimum: 0, maximum: 100 },
              reasoning: { type: "string" },
              suggestedTask: {
                type: ["object", "null"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high", "critical"],
                  },
                },
              },
              suggestedProject: {
                type: ["object", "null"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  effortLevel: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                  },
                  potentialImpact: { type: "number", minimum: 0, maximum: 100 },
                },
              },
              requiresReview: { type: "boolean" },
              reviewReason: { type: ["string", "null"] },
            },
            required: [
              "category",
              "confidence",
              "reasoning",
              "suggestedTask",
              "suggestedProject",
              "requiresReview",
            ],
          },
        },
      },
    });

    const responseContent = response.choices[0].message.content;
    const responseStr = typeof responseContent === 'string' ? responseContent : JSON.stringify(responseContent);
    const result = JSON.parse(responseStr);

    // Aktualisiere Notiz mit Kategorie
    await db
      .update(notes)
      .set({
        category: result.category,
        status: result.requiresReview ? "review" : "processed",
      })
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));

    // Wenn Aufgabe vorgeschlagen: erstelle Task
    if (result.suggestedTask && result.confidence > 70) {
      const taskResult = await db
        .insert(tasks)
        .values({
          userId,
          title: result.suggestedTask.title,
          description: result.suggestedTask.description,
          priority: result.suggestedTask.priority,
          status: "todo",
          extractedFrom: content,
        });

      // Get the inserted ID from the result
      const insertedTask = await db
        .select()
        .from(tasks)
        .orderBy((t) => t.id)
        .limit(1)
        .then((result) => result[0]);

      if (insertedTask) {
        result.suggestedTask.id = insertedTask.id;
      }
    }

    // Wenn Projekt vorgeschlagen: erstelle Project
    if (result.suggestedProject && result.confidence > 70) {
      await db
        .insert(projects)
        .values({
          userId,
          noteId,
          title: result.suggestedProject.title,
          description: result.suggestedProject.description,
          effortLevel: result.suggestedProject.effortLevel,
          potentialImpact: result.suggestedProject.potentialImpact,
          status: "idea",
        });

      // Get the inserted project
      const insertedProject = await db
        .select()
        .from(projects)
        .where(eq(projects.noteId, noteId))
        .then((result) => result[0]);

      if (insertedProject) {
        result.suggestedProject.id = insertedProject.id;
      }
    }

    return {
      noteId,
      ...result,
    };
  } catch (error) {
    console.error("[Categorization] Error:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to categorize note",
    });
  }
}

/**
 * Führt Kategorisierungs-Job für alle unverarbeiteten Notizen eines Benutzers aus
 */
export async function runCategorizationJob(userId: number): Promise<{
  processed: number;
  requiresReview: number;
  errors: number;
}> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Hole alle unverarbeiteten Notizen
    const unprocessedNotes = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.userId, userId),
          eq(notes.status, "unprocessed")
        )
      );

    let processed = 0;
    let requiresReview = 0;
    let errors = 0;

    // Kategorisiere jede Notiz
    for (const note of unprocessedNotes) {
      try {
        const result = await categorizeNote(
          userId,
          note.id,
          note.content,
          note.title || undefined
        );

        processed++;
        if (result.requiresReview) {
          requiresReview++;
        }
      } catch (error) {
        console.error(`[Categorization] Failed to categorize note ${note.id}:`, error);
        errors++;
      }
    }

    console.log(
      `[Categorization] Job completed: ${processed} processed, ${requiresReview} require review, ${errors} errors`
    );

    return { processed, requiresReview, errors };
  } catch (error) {
    console.error("[Categorization] Job failed:", error);
    throw error;
  }
}

/**
 * Startet periodischen Scheduler für Kategorisierung
 */
export function startCategorizationScheduler(intervalMinutes: number = 30) {
  console.log(
    `[Scheduler] Starting categorization scheduler (interval: ${intervalMinutes} minutes)`
  );

  setInterval(async () => {
    try {
      const db = await getDb();
      if (!db) return;

      // Hole alle Benutzer mit unverarbeiteten Notizen
      const usersWithUnprocessedNotes = await db
        .selectDistinct({ userId: notes.userId })
        .from(notes)
        .where(eq(notes.status, "unprocessed"));

      for (const { userId } of usersWithUnprocessedNotes) {
        try {
          await runCategorizationJob(userId);
        } catch (error) {
          console.error(`[Scheduler] Failed for user ${userId}:`, error);
        }
      }
    } catch (error) {
      console.error("[Scheduler] Error:", error);
    }
  }, intervalMinutes * 60 * 1000);
}
