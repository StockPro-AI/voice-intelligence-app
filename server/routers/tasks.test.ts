import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tasksRouter } from './tasks';
import * as dbTasks from '../db-tasks';
import { invokeLLM } from '../_core/llm';

// Mock dependencies
vi.mock('../db-tasks');
vi.mock('../_core/llm');

describe('tasksRouter', () => {
  const mockUser = { id: 1, name: 'Test User', role: 'user' as const };
  const mockContext = { user: mockUser };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTasks', () => {
    it('should fetch tasks for the current user', async () => {
      const mockTasks = [
        {
          id: 1,
          userId: 1,
          title: 'Test Task',
          priority: 'high' as const,
          status: 'todo' as const,
          recordingId: null,
          description: null,
          dueDate: null,
          completedAt: null,
          tags: '[]',
          extractedFrom: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(dbTasks.getUserTasks).mockResolvedValue(mockTasks);

      const caller = tasksRouter.createCaller(mockContext as any);
      const result = await caller.getTasks({
        limit: 50,
        offset: 0,
      });

      expect(result.success).toBe(true);
      expect(result.tasks).toEqual(mockTasks);
      expect(result.count).toBe(1);
      expect(dbTasks.getUserTasks).toHaveBeenCalledWith(1, {
        status: undefined,
        priority: undefined,
        limit: 50,
        offset: 0,
      });
    });

    it('should filter tasks by status', async () => {
      vi.mocked(dbTasks.getUserTasks).mockResolvedValue([]);

      const caller = tasksRouter.createCaller(mockContext as any);
      await caller.getTasks({
        status: 'done',
        limit: 50,
        offset: 0,
      });

      expect(dbTasks.getUserTasks).toHaveBeenCalledWith(1, {
        status: 'done',
        priority: undefined,
        limit: 50,
        offset: 0,
      });
    });
  });

  describe('updateTask', () => {
    it('should update a task', async () => {
      const mockTask = {
        id: 1,
        userId: 1,
        title: 'Updated Task',
        priority: 'high' as const,
        status: 'done' as const,
        recordingId: null,
        description: null,
        dueDate: null,
        completedAt: new Date(),
        tags: '[]',
        extractedFrom: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(dbTasks.getTaskById).mockResolvedValue(mockTask);
      vi.mocked(dbTasks.updateTask).mockResolvedValue(mockTask);

      const caller = tasksRouter.createCaller(mockContext as any);
      const result = await caller.updateTask({
        taskId: 1,
        status: 'done',
        priority: 'high',
      });

      expect(result.success).toBe(true);
      expect(result.task).toEqual(mockTask);
      expect(dbTasks.updateTask).toHaveBeenCalledWith(1, 1, {
        status: 'done',
        priority: 'high',
        title: undefined,
        description: undefined,
        dueDate: undefined,
      });
    });

    it('should throw error if task not found', async () => {
      vi.mocked(dbTasks.getTaskById).mockResolvedValue(null);

      const caller = tasksRouter.createCaller(mockContext as any);

      await expect(
        caller.updateTask({
          taskId: 999,
          status: 'done',
        })
      ).rejects.toThrow('Task not found');
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      vi.mocked(dbTasks.deleteTask).mockResolvedValue(true);

      const caller = tasksRouter.createCaller(mockContext as any);
      const result = await caller.deleteTask({ taskId: 1 });

      expect(result.success).toBe(true);
      expect(dbTasks.deleteTask).toHaveBeenCalledWith(1, 1);
    });

    it('should throw error if task not found', async () => {
      vi.mocked(dbTasks.deleteTask).mockResolvedValue(false);

      const caller = tasksRouter.createCaller(mockContext as any);

      await expect(
        caller.deleteTask({ taskId: 999 })
      ).rejects.toThrow('Failed to delete task');
    });
  });

  describe('getTasksSorted', () => {
    it('should return tasks sorted by priority', async () => {
      const mockTasks = [
        {
          id: 1,
          userId: 1,
          title: 'Critical Task',
          priority: 'critical' as const,
          status: 'todo' as const,
          recordingId: null,
          description: null,
          dueDate: null,
          completedAt: null,
          tags: '[]',
          extractedFrom: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          title: 'Low Task',
          priority: 'low' as const,
          status: 'todo' as const,
          recordingId: null,
          description: null,
          dueDate: null,
          completedAt: null,
          tags: '[]',
          extractedFrom: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(dbTasks.getTasksSortedByPriority).mockResolvedValue(mockTasks);

      const caller = tasksRouter.createCaller(mockContext as any);
      const result = await caller.getTasksSorted({ includeCompleted: false });

      expect(result.success).toBe(true);
      expect(result.tasks).toEqual(mockTasks);
      expect(dbTasks.getTasksSortedByPriority).toHaveBeenCalledWith(1, false);
    });
  });

  describe('extractTasks', () => {
    it('should extract tasks from transcription', async () => {
      const mockLLMResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                tasks: [
                  {
                    title: 'Buy groceries',
                    description: 'Milk, eggs, bread',
                    priority: 'medium',
                    tags: ['shopping'],
                  },
                ],
              }),
            },
          },
        ],
      };

      const mockCreatedTask = {
        id: 1,
        userId: 1,
        title: 'Buy groceries',
        priority: 'medium' as const,
        status: 'todo' as const,
        recordingId: 1,
        description: 'Milk, eggs, bread',
        dueDate: null,
        completedAt: null,
        tags: '["shopping"]',
        extractedFrom: 'Test transcription',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse as any);
      vi.mocked(dbTasks.createTask).mockResolvedValue(mockCreatedTask);

      const caller = tasksRouter.createCaller(mockContext as any);
      const result = await caller.extractTasks({
        recordingId: 1,
        transcription: 'I need to buy groceries: milk, eggs, bread',
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.tasks).toEqual([mockCreatedTask]);
    });

    it('should handle LLM errors gracefully', async () => {
      vi.mocked(invokeLLM).mockRejectedValue(new Error('LLM Error'));

      const caller = tasksRouter.createCaller(mockContext as any);

      await expect(
        caller.extractTasks({
          recordingId: 1,
          transcription: 'Test',
        })
      ).rejects.toThrow('LLM Error');
    });
  });
});
