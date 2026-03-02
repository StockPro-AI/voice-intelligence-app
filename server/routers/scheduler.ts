import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { schedulerConfig, notes } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { categorizeNote, runCategorizationJob } from "../services/schedulerService";

export const schedulerRouter = router({
  // Get scheduler configuration
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let config = await db
        .select()
        .from(schedulerConfig)
        .where(eq(schedulerConfig.userId, ctx.user.id))
        .then((result) => result[0]);

      // Create default config if not exists
      if (!config) {
        await db
          .insert(schedulerConfig)
          .values({
            userId: ctx.user.id,
          });

        config = await db
          .select()
          .from(schedulerConfig)
          .where(eq(schedulerConfig.userId, ctx.user.id))
          .then((result) => result[0]);
      }

      return { success: true, config };
    } catch (error) {
      console.error("[Scheduler] Get config failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get scheduler config",
      });
    }
  }),

  // Update scheduler configuration
  updateConfig: protectedProcedure
    .input(
      z.object({
        categorizationIntervalMinutes: z.number().min(5).max(1440).optional(),
        analysisIntervalMinutes: z.number().min(60).max(10080).optional(),
        enableAutoCategorization: z.boolean().optional(),
        enableAutoAnalysis: z.boolean().optional(),
        enableAutoExtraction: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const updated = await db
          .update(schedulerConfig)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(schedulerConfig.userId, ctx.user.id))
          .then((result) => result);

        if (!updated) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Scheduler config not found",
          });
        }

        return { success: true, message: "Configuration updated" };
      } catch (error) {
        console.error("[Scheduler] Update config failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update scheduler config",
        });
      }
    }),

  // Manually trigger categorization for a single note
  categorizeNote: protectedProcedure
    .input(
      z.object({
        noteId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verify note belongs to user
        const note = await db
          .select()
          .from(notes)
          .where(eq(notes.id, input.noteId))
          .then((result) => result[0]);

        if (!note || note.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Note not found or access denied",
          });
        }

        const result = await categorizeNote(
          ctx.user.id,
          input.noteId,
          note.content,
          note.title || undefined
        );

        return { success: true, result };
      } catch (error) {
        console.error("[Scheduler] Categorize note failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to categorize note",
        });
      }
    }),

  // Manually trigger categorization job for all unprocessed notes
  runCategorization: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const result = await runCategorizationJob(ctx.user.id);

      return {
        success: true,
        message: `Categorization completed: ${result.processed} processed, ${result.requiresReview} require review, ${result.errors} errors`,
        ...result,
      };
    } catch (error) {
      console.error("[Scheduler] Run categorization failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to run categorization job",
      });
    }
  }),

  // Get unprocessed notes count
  getUnprocessedCount: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const count = await db
        .select()
        .from(notes)
        .where(eq(notes.userId, ctx.user.id))
        .then((result) => result.filter((n) => n.status === "unprocessed").length);

      return { success: true, count };
    } catch (error) {
      console.error("[Scheduler] Get unprocessed count failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get unprocessed count",
      });
    }
  }),

  // Get notes requiring review
  getReviewNotes: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const reviewNotes = await db
          .select()
          .from(notes)
          .where(eq(notes.userId, ctx.user.id))
          .then((result) =>
            result
              .filter((n) => n.status === "review")
              .slice(input.offset, input.offset + input.limit)
          );

        return { success: true, notes: reviewNotes };
      } catch (error) {
        console.error("[Scheduler] Get review notes failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get review notes",
        });
      }
    }),

  // Get scheduler statistics
  getStatistics: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allNotes = await db
        .select()
        .from(notes)
        .where(eq(notes.userId, ctx.user.id));

      const stats = {
        total: allNotes.length,
        unprocessed: allNotes.filter((n) => n.status === "unprocessed").length,
        processed: allNotes.filter((n) => n.status === "processed").length,
        review: allNotes.filter((n) => n.status === "review").length,
        byCategory: {
          raw: allNotes.filter((n) => n.category === "raw").length,
          processed: allNotes.filter((n) => n.category === "processed").length,
        },
      };

      return { success: true, stats };
    } catch (error) {
      console.error("[Scheduler] Get statistics failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get statistics",
      });
    }
  }),
});
