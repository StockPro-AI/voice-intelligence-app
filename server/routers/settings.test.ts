import { describe, expect, it, vi } from 'vitest';
import { settingsRouter } from './settings';

// Mock the database functions
vi.mock('../db', () => ({
  getUserSettings: vi.fn(),
  updateUserSettings: vi.fn(),
}));

import { getUserSettings, updateUserSettings } from '../db';

describe('settingsRouter', () => {
  const mockUser = {
    id: 1,
    openId: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    loginMethod: 'manus',
    role: 'user' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const mockSettings = {
    id: 1,
    userId: 1,
    globalHotkey: 'Alt+Shift+V',
    transcriptionLanguage: 'en',
    enrichmentMode: 'summary' as const,
    autoEnrich: false,
    darkMode: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getSettings', () => {
    it('should return user settings', async () => {
      vi.mocked(getUserSettings).mockResolvedValue(mockSettings);

      const caller = settingsRouter.createCaller({ user: mockUser });

      const result = await caller.getSettings();

      expect(result.success).toBe(true);
      expect(result.settings).toEqual(mockSettings);
      expect(getUserSettings).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return default settings if none exist', async () => {
      vi.mocked(getUserSettings).mockResolvedValue(undefined);

      const caller = settingsRouter.createCaller({ user: mockUser });

      const result = await caller.getSettings();

      expect(result.success).toBe(true);
      expect(result.settings.globalHotkey).toBe('Alt+Shift+V');
      expect(result.settings.transcriptionLanguage).toBe('en');
    });
  });

  describe('updateHotkey', () => {
    it('should update hotkey successfully', async () => {
      const updatedSettings = { ...mockSettings, globalHotkey: 'Ctrl+Shift+K' };
      vi.mocked(updateUserSettings).mockResolvedValue(updatedSettings);

      const caller = settingsRouter.createCaller({ user: mockUser });

      const result = await caller.updateHotkey({ hotkey: 'Ctrl+Shift+K' });

      expect(result.success).toBe(true);
      expect(result.hotkey).toBe('Ctrl+Shift+K');
      expect(updateUserSettings).toHaveBeenCalledWith(mockUser.id, {
        globalHotkey: 'Ctrl+Shift+K',
      });
    });

    it('should reject invalid hotkey format', async () => {
      const caller = settingsRouter.createCaller({ user: mockUser });

      try {
        await caller.updateHotkey({ hotkey: 'InvalidHotkey' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('updateTranscriptionLanguage', () => {
    it('should update transcription language', async () => {
      const updatedSettings = { ...mockSettings, transcriptionLanguage: 'de' };
      vi.mocked(updateUserSettings).mockResolvedValue(updatedSettings);

      const caller = settingsRouter.createCaller({ user: mockUser });

      const result = await caller.updateTranscriptionLanguage({ language: 'de' });

      expect(result.success).toBe(true);
      expect(result.language).toBe('de');
      expect(updateUserSettings).toHaveBeenCalledWith(mockUser.id, {
        transcriptionLanguage: 'de',
      });
    });
  });

  describe('updateEnrichmentMode', () => {
    it('should update enrichment mode', async () => {
      const updatedSettings = { ...mockSettings, enrichmentMode: 'structure' as const };
      vi.mocked(updateUserSettings).mockResolvedValue(updatedSettings);

      const caller = settingsRouter.createCaller({ user: mockUser });

      const result = await caller.updateEnrichmentMode({ mode: 'structure' });

      expect(result.success).toBe(true);
      expect(result.mode).toBe('structure');
    });
  });

  describe('updateAutoEnrich', () => {
    it('should update auto-enrich setting', async () => {
      const updatedSettings = { ...mockSettings, autoEnrich: true };
      vi.mocked(updateUserSettings).mockResolvedValue(updatedSettings);

      const caller = settingsRouter.createCaller({ user: mockUser });

      const result = await caller.updateAutoEnrich({ autoEnrich: true });

      expect(result.success).toBe(true);
      expect(result.autoEnrich).toBe(true);
    });
  });

  describe('updateDarkMode', () => {
    it('should update dark mode setting', async () => {
      const updatedSettings = { ...mockSettings, darkMode: false };
      vi.mocked(updateUserSettings).mockResolvedValue(updatedSettings);

      const caller = settingsRouter.createCaller({ user: mockUser });

      const result = await caller.updateDarkMode({ darkMode: false });

      expect(result.success).toBe(true);
      expect(result.darkMode).toBe(false);
    });
  });

  describe('getAvailableLanguages', () => {
    it('should return list of available languages', async () => {
      const caller = settingsRouter.createCaller({ user: mockUser });

      const result = await caller.getAvailableLanguages();

      expect(result.success).toBe(true);
      expect(result.languages).toBeInstanceOf(Array);
      expect(result.languages.length).toBeGreaterThan(0);

      const enLanguage = result.languages.find((l) => l.code === 'en');
      expect(enLanguage).toBeDefined();
      expect(enLanguage?.name).toBe('English');
    });
  });
});
