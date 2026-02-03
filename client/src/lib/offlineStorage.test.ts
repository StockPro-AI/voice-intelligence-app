import { describe, it, expect, beforeEach, vi } from 'vitest';
import { offlineStorageService, OfflineRecording } from './offlineStorage';

describe('OfflineStorageService', () => {
  beforeEach(async () => {
    // Initialize the service
    await offlineStorageService.init();
    // Clear all data before each test
    await offlineStorageService.clearAll();
  });

  const createMockRecording = (overrides?: Partial<OfflineRecording>): OfflineRecording => ({
    id: 'test-1',
    transcript: 'Test transcript',
    enrichedResult: 'Test enriched result',
    language: 'en',
    enrichmentMode: 'summary',
    duration: 30,
    createdAt: new Date(),
    audioBase64: 'base64data',
    synced: false,
    ...overrides
  });

  it('should save and retrieve a recording', async () => {
    const recording = createMockRecording();
    await offlineStorageService.saveRecording(recording);

    const retrieved = await offlineStorageService.getRecording('test-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.transcript).toBe('Test transcript');
  });

  it('should get all recordings', async () => {
    const recording1 = createMockRecording({ id: 'test-1' });
    const recording2 = createMockRecording({ id: 'test-2' });

    await offlineStorageService.saveRecording(recording1);
    await offlineStorageService.saveRecording(recording2);

    const all = await offlineStorageService.getAllRecordings();
    expect(all.length).toBe(2);
  });

  it('should get unsynced recordings', async () => {
    const recording1 = createMockRecording({ id: 'test-1', synced: false });
    const recording2 = createMockRecording({ id: 'test-2', synced: true });

    await offlineStorageService.saveRecording(recording1);
    await offlineStorageService.saveRecording(recording2);

    const unsynced = await offlineStorageService.getUnsyncedRecordings();
    expect(unsynced.length).toBe(1);
    expect(unsynced[0].id).toBe('test-1');
  });

  it('should delete a recording', async () => {
    const recording = createMockRecording();
    await offlineStorageService.saveRecording(recording);

    await offlineStorageService.deleteRecording('test-1');

    const retrieved = await offlineStorageService.getRecording('test-1');
    expect(retrieved).toBeUndefined();
  });

  it('should mark recording as synced', async () => {
    const recording = createMockRecording({ synced: false });
    await offlineStorageService.saveRecording(recording);

    await offlineStorageService.markAsSynced('test-1');

    const retrieved = await offlineStorageService.getRecording('test-1');
    expect(retrieved?.synced).toBe(true);
  });

  it('should clear all recordings', async () => {
    const recording1 = createMockRecording({ id: 'test-1' });
    const recording2 = createMockRecording({ id: 'test-2' });

    await offlineStorageService.saveRecording(recording1);
    await offlineStorageService.saveRecording(recording2);

    await offlineStorageService.clearAll();

    const all = await offlineStorageService.getAllRecordings();
    expect(all.length).toBe(0);
  });

  it('should calculate storage size', async () => {
    const recording = createMockRecording({
      transcript: 'a'.repeat(100),
      enrichedResult: 'b'.repeat(100),
      audioBase64: 'c'.repeat(100)
    });

    await offlineStorageService.saveRecording(recording);

    const size = await offlineStorageService.getStorageSize();
    expect(size).toBeGreaterThan(0);
  });

  it('should update existing recording', async () => {
    const recording = createMockRecording();
    await offlineStorageService.saveRecording(recording);

    const updated = createMockRecording({
      transcript: 'Updated transcript',
      synced: true
    });
    await offlineStorageService.saveRecording(updated);

    const retrieved = await offlineStorageService.getRecording('test-1');
    expect(retrieved?.transcript).toBe('Updated transcript');
    expect(retrieved?.synced).toBe(true);
  });
});
