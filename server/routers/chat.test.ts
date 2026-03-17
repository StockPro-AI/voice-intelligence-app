import { describe, it, expect, vi, beforeEach } from "vitest";
import { chatRouter } from "./chat";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";

// Mock dependencies
vi.mock("../db");
vi.mock("../_core/llm");

describe("Chat Router", () => {
  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  };

  const mockContext = {
    user: {
      id: 1,
      name: "Test User",
      email: "test@example.com",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDb).mockResolvedValue(mockDb as any);
  });

  describe("sendMessage", () => {
    it("should send a message and get AI response", async () => {
      const mockNote = {
        id: 1,
        userId: 1,
        title: "Test Note",
        content: "Test content",
        category: "task",
        status: "processed",
        tags: "test",
      };

      const mockLLMResponse = {
        choices: [
          {
            message: {
              content: "This is an AI response",
            },
          },
        ],
      };

      // Mock database queries
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockNote]),
          }),
        }),
      });

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse as any);

      const procedure = chatRouter.createCaller(mockContext as any).sendMessage;

      const result = await procedure({
        noteId: 1,
        message: "What is this note about?",
      });

      expect(result.userMessage).toBe("What is this note about?");
      expect(result.assistantMessage).toBe("This is an AI response");
      expect(result.timestamp).toBeDefined();
    });

    it("should throw error if note not found", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const procedure = chatRouter.createCaller(mockContext as any).sendMessage;

      await expect(
        procedure({
          noteId: 999,
          message: "What is this note about?",
        })
      ).rejects.toThrow("Note not found");
    });

    it("should throw error if database not available", async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      const procedure = chatRouter.createCaller(mockContext as any).sendMessage;

      await expect(
        procedure({
          noteId: 1,
          message: "What is this note about?",
        })
      ).rejects.toThrow("Database not available");
    });
  });

  describe("getChatHistory", () => {
    it("should retrieve chat history for a note", async () => {
      const mockNote = {
        id: 1,
        userId: 1,
        title: "Test Note",
        content: "Test content",
        category: "task",
        status: "processed",
        tags: "test",
      };

      const mockChatHistory = [
        {
          id: 1,
          userId: 1,
          recordingId: null,
          role: "user" as const,
          message: "Hello",
          metadata: JSON.stringify({ noteId: 1 }),
          createdAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          recordingId: null,
          role: "assistant" as const,
          message: "Hi there!",
          metadata: JSON.stringify({ noteId: 1 }),
          createdAt: new Date(),
        },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockNote]),
          }),
        }),
      });

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockNote]),
          }),
        }),
      });

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockChatHistory),
            }),
          }),
        }),
      });

      const procedure = chatRouter.createCaller(mockContext as any)
        .getChatHistory;

      const result = await procedure({ noteId: 1 });

      expect(result).toHaveLength(2);
      // Messages are reversed in getChatHistory
      expect(result[0].role).toBe("assistant");
      expect(result[1].role).toBe("user");
    });

    it("should throw error if note not found", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const procedure = chatRouter.createCaller(mockContext as any)
        .getChatHistory;

      await expect(procedure({ noteId: 999 })).rejects.toThrow(
        "Note not found"
      );
    });
  });

  describe("deleteChatHistory", () => {
    it("should delete chat history for a note", async () => {
      const mockNote = {
        id: 1,
        userId: 1,
        title: "Test Note",
        content: "Test content",
        category: "task",
        status: "processed",
        tags: "test",
      };

      const mockChatHistory = [
        {
          id: 1,
          userId: 1,
          recordingId: null,
          role: "user" as const,
          message: "Hello",
          metadata: JSON.stringify({ noteId: 1 }),
          createdAt: new Date(),
        },
      ];

      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockNote]),
              }),
            }),
          };
        } else {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(mockChatHistory),
            }),
          };
        }
      });

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const procedure = chatRouter.createCaller(mockContext as any)
        .deleteChatHistory;

      const result = await procedure({ noteId: 1 });

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(1);
    });

    it("should throw error if note not found", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const procedure = chatRouter.createCaller(mockContext as any)
        .deleteChatHistory;

      await expect(procedure({ noteId: 999 })).rejects.toThrow(
        "Note not found"
      );
    });
  });
});
