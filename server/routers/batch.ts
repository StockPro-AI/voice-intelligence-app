import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { recordingHistory } from '../../drizzle/schema';
import { inArray, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const batchRouter = router({
  deleteRecordings: protectedProcedure
    .input(z.object({
      ids: z.array(z.number()).min(1, 'At least one recording must be selected')
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available'
        });
      }

      try {
        // Verify all recordings belong to current user
        const recordings = await db
          .select()
          .from(recordingHistory)
          .where(
            inArray(recordingHistory.id, input.ids)
          );

        const userRecordings = recordings.filter(r => r.userId === ctx.user.id);
        
        if (userRecordings.length === 0) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No recordings found to delete'
          });
        }

        // Delete recordings
        await db
          .delete(recordingHistory)
          .where(
            inArray(recordingHistory.id, userRecordings.map(r => r.id))
          );

        return {
          success: true,
          deletedCount: userRecordings.length
        };
      } catch (error) {
        console.error('[Batch Delete Error]', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete recordings'
        });
      }
    }),

  favoriteRecordings: protectedProcedure
    .input(z.object({
      ids: z.array(z.number()).min(1),
      isFavorite: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available'
        });
      }

      try {
        // Verify ownership and update
        const recordings = await db
          .select()
          .from(recordingHistory)
          .where(
            inArray(recordingHistory.id, input.ids)
          );

        const userRecordings = recordings.filter(r => r.userId === ctx.user.id);

        if (userRecordings.length === 0) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No recordings found'
          });
        }

        await db
          .update(recordingHistory)
          .set({ isFavorite: input.isFavorite })
          .where(
            inArray(recordingHistory.id, userRecordings.map(r => r.id))
          );

        return {
          success: true,
          updatedCount: userRecordings.length
        };
      } catch (error) {
        console.error('[Batch Favorite Error]', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update recordings'
        });
      }
    })
});
