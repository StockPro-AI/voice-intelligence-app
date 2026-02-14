import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import {
  createRecordingHistory,
  getRecordingHistory,
  getRecordingById,
  updateRecording,
  deleteRecording,
  toggleFavorite,
} from '../db';

export const historyRouter = router({
  // Create a new recording history entry
  create: protectedProcedure
    .input(
      z.object({
        audioUrl: z.string(),
        transcription: z.string(),
        enrichedResult: z.string().optional(),
        enrichmentMode: z.enum(['summary', 'structure', 'format', 'context']).optional(),
        transcriptionLanguage: z.string(),
        duration: z.number().optional(),
        title: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await createRecordingHistory(ctx.user.id, {
        audioUrl: input.audioUrl,
        transcription: input.transcription,
        enrichedResult: input.enrichedResult,
        enrichmentMode: input.enrichmentMode,
        transcriptionLanguage: input.transcriptionLanguage,
        duration: input.duration,
        title: input.title,
        notes: input.notes,
      });
      return result;
    }),

  // Get recording history with pagination
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const recordings = await getRecordingHistory(ctx.user.id, input.limit, input.offset);
      return { recordings };
    }),

  // Get a specific recording by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const recording = await getRecordingById(input.id, ctx.user.id);
      if (!recording) {
        throw new Error('Recording not found');
      }
      return recording;
    }),

  // Update a recording
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        notes: z.string().optional(),
        enrichedResult: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await updateRecording(input.id, ctx.user.id, {
        title: input.title,
        notes: input.notes,
        enrichedResult: input.enrichedResult,
      });
      return updated;
    }),

  // Delete a recording
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const success = await deleteRecording(input.id, ctx.user.id);
      if (!success) {
        throw new Error('Failed to delete recording');
      }
      return { success: true };
    }),

  // Toggle favorite status
  toggleFavorite: protectedProcedure
    .input(z.object({ id: z.number(), isFavorite: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await toggleFavorite(input.id, ctx.user.id, input.isFavorite);
      return updated;
    }),

  // Get favorite recordings
  getFavorites: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const recordings = await getRecordingHistory(ctx.user.id, input.limit, input.offset);
      const favorites = recordings.filter((r) => r.isFavorite);
      return { recordings: favorites };
    }),
});
