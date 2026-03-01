import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { notes, projects, schedulerConfig, categorizationFeedback } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const orchestrationRouter = router({
  // Notes Management
  createNote: protectedProcedure
    .input(
      z.object({
        recordingId: z.number().optional(),
        title: z.string().optional(),
        content: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [note] = await db
          .insert(notes)
          .values({
            userId: ctx.user.id,
            recordingId: input.recordingId,
            title: input.title,
            content: input.content,
            category: "raw",
            status: "unprocessed",
          })
          .$returningId();

        return { success: true, note };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create note",
        });
      }
    }),

  getNotes: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const allNotes = await db
          .select()
          .from(notes)
          .where(eq(notes.userId, ctx.user.id))
          .limit(input.limit)
          .offset(input.offset);

        return { success: true, notes: allNotes };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch notes",
        });
      }
    }),

  // Projects Management
  getProjects: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const allProjects = await db
          .select()
          .from(projects)
          .where(eq(projects.userId, ctx.user.id))
          .limit(input.limit)
          .offset(input.offset);

        return { success: true, projects: allProjects };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch projects",
        });
      }
    }),

  // Scheduler Configuration
  getSchedulerConfig: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const config = await db
        .select()
        .from(schedulerConfig)
        .where(eq(schedulerConfig.userId, ctx.user.id))
        .then((result) => result[0]);

      if (!config) {
        const [newConfig] = await db
          .insert(schedulerConfig)
          .values({
            userId: ctx.user.id,
          })
          .$returningId();

        return { success: true, config: newConfig };
      }

      return { success: true, config };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch scheduler config",
      });
    }
  }),

  // Categorization Feedback
  submitCategorizationFeedback: protectedProcedure
    .input(
      z.object({
        noteId: z.number(),
        originalCategory: z.string(),
        suggestedCategory: z.string(),
        userFeedback: z.enum(["correct", "incorrect", "partial", "unclear"]),
        userCorrection: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [feedback] = await db
          .insert(categorizationFeedback)
          .values({
            userId: ctx.user.id,
            noteId: input.noteId,
            originalCategory: input.originalCategory,
            suggestedCategory: input.suggestedCategory,
            userFeedback: input.userFeedback,
            userCorrection: input.userCorrection,
          })
          .$returningId();

        return { success: true, feedback };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit feedback",
        });
      }
    }),
});
