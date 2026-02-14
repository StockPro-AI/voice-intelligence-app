import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyticsRouter } from './analytics';
import * as dbAnalytics from '../db-analytics';
import { invokeLLM } from '../_core/llm';

// Mock dependencies
vi.mock('../db-analytics');
vi.mock('../_core/llm');

describe('analyticsRouter', () => {
  const mockUser = { id: 1, name: 'Test User', role: 'user' as const };
  const mockContext = { user: mockUser };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getWeekBoundaries
    vi.mocked(dbAnalytics.getWeekBoundaries as any).mockReturnValue({
      weekStart: new Date('2026-02-08'),
      weekEnd: new Date('2026-02-14'),
    });
  });

  describe('generateWeeklyAnalysis', () => {
    it('should generate weekly analysis from recordings', async () => {
      const mockRecordings = [
        {
          id: 1,
          userId: 1,
          transcription: 'Discussed project planning and team collaboration',
          audioUrl: 'https://example.com/audio.mp3',
          enrichedResult: null,
          enrichmentMode: null,
          transcriptionLanguage: 'en',
          duration: 30,
          title: 'Meeting Notes',
          notes: null,
          isFavorite: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockLLMResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Productive week with focus on team collaboration',
                insights: 'Team is engaged and productive',
                recommendations: 'Continue weekly planning meetings',
              }),
            },
          },
        ],
      };

      vi.mocked(dbAnalytics.getWeekRecordings).mockResolvedValue(mockRecordings);
      vi.mocked(dbAnalytics.getWeekCompletedTasks).mockResolvedValue([]);
      vi.mocked(dbAnalytics.extractTopics).mockReturnValue({ planning: 2, collaboration: 1 });
      vi.mocked(dbAnalytics.calculateWeekMetrics).mockResolvedValue({
        totalRecordings: 1,
        totalRecordingTime: 30,
        avgRecordingDuration: 30,
        completedTasks: 0,
        recordingsByDay: { '2026-02-14': 1 },
        tasksByPriority: { critical: 0, high: 0, medium: 0, low: 0 },
        startDate: new Date(),
        endDate: new Date(),
      });
      vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse as any);
      vi.mocked(dbAnalytics.saveWeeklyAnalysis).mockResolvedValue({
        id: 1,
        userId: 1,
        weekStartDate: new Date(),
        summary: 'Productive week with focus on team collaboration',
        topThemes: '{}',
        projectIdeas: null,
        recommendations: 'Continue weekly planning meetings',
        recordingCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const caller = analyticsRouter.createCaller(mockContext as any);
      const result = await caller.generateWeeklyAnalysis({});

      expect(result.success).toBe(true);
      expect(result.analysis.summary).toBeDefined();
      expect(result.analysis.insights).toBeDefined();
      expect(result.analysis.recommendations).toBeDefined();
      expect(dbAnalytics.getWeekRecordings).toHaveBeenCalled();
    });

    it('should throw error if no recordings found', async () => {
      vi.mocked(dbAnalytics.getWeekRecordings).mockResolvedValue([]);

      const caller = analyticsRouter.createCaller(mockContext as any);

      await expect(
        caller.generateWeeklyAnalysis({})
      ).rejects.toThrow('No recordings found for this week');
    });
  });

  describe('generateProjectIdeas', () => {
    it('should generate project ideas from weekly data', async () => {
      const mockRecordings = [
        {
          id: 1,
          userId: 1,
          transcription: 'Thinking about building a new productivity app',
          audioUrl: 'https://example.com/audio.mp3',
          enrichedResult: null,
          enrichmentMode: null,
          transcriptionLanguage: 'en',
          duration: 30,
          title: 'Ideas',
          notes: null,
          isFavorite: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockLLMResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                ideas: [
                  {
                    title: 'Productivity App',
                    description: 'Build a new productivity tracking app',
                    effort_level: 'high',
                    potential_impact: 'high',
                    skills_needed: ['React', 'Node.js'],
                    estimated_timeline: '3 months',
                  },
                ],
              }),
            },
          },
        ],
      };

      vi.mocked(dbAnalytics.getWeekRecordings).mockResolvedValue(mockRecordings);
      vi.mocked(dbAnalytics.extractTopics).mockReturnValue({ productivity: 2, app: 1 });
      vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse as any);

      const caller = analyticsRouter.createCaller(mockContext as any);
      const result = await caller.generateProjectIdeas({});

      expect(result.success).toBe(true);
      expect(result.ideas.length).toBeGreaterThan(0);
      expect(result.ideas[0].title).toBeDefined();
      expect(result.ideas[0].effort_level).toBeDefined();
    });

    it('should throw error if no recordings found', async () => {
      vi.mocked(dbAnalytics.getWeekRecordings).mockResolvedValue([]);

      const caller = analyticsRouter.createCaller(mockContext as any);

      await expect(
        caller.generateProjectIdeas({})
      ).rejects.toThrow('No recordings found for this week');
    });
  });

  describe('getTrends', () => {
    it('should fetch productivity trends', async () => {
      const mockAnalyses = [
        {
          id: 1,
          userId: 1,
          weekStartDate: new Date('2026-02-08'),
          summary: 'Good week',
          topThemes: '{"productivity": 5, "meetings": 3}',
          projectIdeas: null,
          recommendations: 'Keep it up',
          recordingCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(dbAnalytics.getWeeklyAnalysesByRange).mockResolvedValue(mockAnalyses);

      const caller = analyticsRouter.createCaller(mockContext as any);
      const result = await caller.getTrends({ weeks: 4 });

      expect(result.success).toBe(true);
      expect(result.trends.length).toBeGreaterThan(0);
      expect(result.trends[0].recordingCount).toBeDefined();
      expect(dbAnalytics.getWeeklyAnalysesByRange).toHaveBeenCalledWith(1, expect.any(Date), expect.any(Date), 4);
    });
  });

  describe('getLatestAnalysis', () => {
    it('should fetch latest analysis', async () => {
      const mockAnalysis = {
        id: 1,
        userId: 1,
        weekStartDate: new Date(),
        summary: 'Productive week',
        topThemes: '{"productivity": 5}',
        projectIdeas: '[]',
        recommendations: 'Continue',
        recordingCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(dbAnalytics.getLatestWeeklyAnalysis).mockResolvedValue(mockAnalysis);

      const caller = analyticsRouter.createCaller(mockContext as any);
      const result = await caller.getLatestAnalysis();

      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.analysis?.summary).toBe('Productive week');
    });

    it('should return null if no analysis available', async () => {
      vi.mocked(dbAnalytics.getLatestWeeklyAnalysis).mockResolvedValue(null);

      const caller = analyticsRouter.createCaller(mockContext as any);
      const result = await caller.getLatestAnalysis();

      expect(result.success).toBe(false);
      expect(result.analysis).toBeNull();
    });
  });
});
