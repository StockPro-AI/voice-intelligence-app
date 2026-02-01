import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getUserSettings, updateUserSettings } from '../db';
import { TRANSCRIPTION_LANGUAGES } from '../../drizzle/schema';

// Hotkey validation regex - allows combinations like Alt+Shift+V, Ctrl+K, etc.
const HOTKEY_REGEX = /^(Ctrl|Shift|Alt|Meta)(\+(Ctrl|Shift|Alt|Meta))*\+[A-Z0-9]$/;

export const settingsRouter = router({
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    try {
      const settings = await getUserSettings(ctx.user.id);
      return {
        success: true,
        settings: settings || {
          globalHotkey: 'Alt+Shift+V',
          transcriptionLanguage: 'en',
          enrichmentMode: 'summary',
          autoEnrich: false,
          darkMode: true,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch settings';
      throw new Error(`Settings fetch error: ${message}`);
    }
  }),

  updateHotkey: protectedProcedure
    .input(
      z.object({
        hotkey: z.string().regex(HOTKEY_REGEX, 'Invalid hotkey format. Use format like: Alt+Shift+V'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const updated = await updateUserSettings(ctx.user.id, {
          globalHotkey: input.hotkey,
        });

        return {
          success: true,
          hotkey: updated?.globalHotkey || input.hotkey,
          message: 'Hotkey updated successfully. Please restart the app for changes to take effect.',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update hotkey';
        throw new Error(`Hotkey update error: ${message}`);
      }
    }),

  updateTranscriptionLanguage: protectedProcedure
    .input(
      z.object({
        language: z.enum(['en', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'ru', 'ja', 'zh']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const updated = await updateUserSettings(ctx.user.id, {
          transcriptionLanguage: input.language,
        });

        return {
          success: true,
          language: updated?.transcriptionLanguage || input.language,
          message: 'Transcription language updated successfully.',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update language';
        throw new Error(`Language update error: ${message}`);
      }
    }),

  updateEnrichmentMode: protectedProcedure
    .input(
      z.object({
        mode: z.enum(['summary', 'structure', 'format', 'context']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const updated = await updateUserSettings(ctx.user.id, {
          enrichmentMode: input.mode,
        });

        return {
          success: true,
          mode: updated?.enrichmentMode || input.mode,
          message: 'Default enrichment mode updated successfully.',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update enrichment mode';
        throw new Error(`Enrichment mode update error: ${message}`);
      }
    }),

  updateAutoEnrich: protectedProcedure
    .input(
      z.object({
        autoEnrich: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const updated = await updateUserSettings(ctx.user.id, {
          autoEnrich: input.autoEnrich,
        });

        return {
          success: true,
          autoEnrich: updated?.autoEnrich || input.autoEnrich,
          message: 'Auto-enrich setting updated successfully.',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update auto-enrich';
        throw new Error(`Auto-enrich update error: ${message}`);
      }
    }),

  updateDarkMode: protectedProcedure
    .input(
      z.object({
        darkMode: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const updated = await updateUserSettings(ctx.user.id, {
          darkMode: input.darkMode,
        });

        return {
          success: true,
          darkMode: updated?.darkMode || input.darkMode,
          message: 'Theme updated successfully.',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update theme';
        throw new Error(`Theme update error: ${message}`);
      }
    }),

  getAvailableLanguages: protectedProcedure.query(() => {
    return {
      success: true,
      languages: Object.entries(TRANSCRIPTION_LANGUAGES).map(([code, name]) => ({
        code,
        name,
      })),
    };
  }),
});
