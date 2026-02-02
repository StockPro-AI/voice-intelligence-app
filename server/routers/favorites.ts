import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { eq, and } from 'drizzle-orm';
import { favorites } from '../../drizzle/schema';

/**
 * Favorites router for managing enrichment mode favorites
 */
export const favoritesRouter = router({
  /**
   * Get all favorites for current user
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    try {
      const userFavorites = await db
        .select()
        .from(favorites)
        .where(eq(favorites.userId, ctx.user.id));

      return userFavorites;
    } catch (error) {
      console.error('[Favorites] Failed to get favorites:', error);
      return [];
    }
  }),

  /**
   * Add enrichment mode to favorites
   */
  add: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        enrichmentMode: z.enum(['summary', 'structure', 'format', 'context']),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      try {
        await db.insert(favorites).values({
          userId: ctx.user.id,
          name: input.name,
          enrichmentMode: input.enrichmentMode,
          description: input.description || null,
        });

        return { success: true };
      } catch (error) {
        console.error('[Favorites] Failed to add favorite:', error);
        throw new Error('Failed to add favorite');
      }
    }),

  /**
   * Remove favorite by ID
   */
  remove: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      try {
        await db
          .delete(favorites)
          .where(
            and(eq(favorites.id, input.id), eq(favorites.userId, ctx.user.id))
          );

        return { success: true };
      } catch (error) {
        console.error('[Favorites] Failed to remove favorite:', error);
        throw new Error('Failed to remove favorite');
      }
    }),

  /**
   * Update favorite
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      try {
        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.description !== undefined)
          updateData.description = input.description;

        await db
          .update(favorites)
          .set(updateData)
          .where(
            and(eq(favorites.id, input.id), eq(favorites.userId, ctx.user.id))
          );

        return { success: true };
      } catch (error) {
        console.error('[Favorites] Failed to update favorite:', error);
        throw new Error('Failed to update favorite');
      }
    }),
});
