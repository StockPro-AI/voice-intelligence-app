import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { 
  createTask, 
  getUserTasks, 
  getTasksSortedByPriority, 
  updateTask, 
  deleteTask, 
  getTaskById 
} from "../db-tasks";

/**
 * Task Management Router
 * Handles task extraction, management, and analysis
 */
export const tasksRouter = router({
  /**
   * Extract tasks from a recording's transcription using LLM
   */
  extractTasks: protectedProcedure
    .input(
      z.object({
        recordingId: z.number(),
        transcription: z.string(),
        language: z.string().default("en"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Use LLM to extract tasks
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a task extraction assistant. Extract actionable tasks from the given transcription. 
              Return a JSON array with objects containing: title (string), description (string), priority (low/medium/high/critical), tags (string array).
              Focus on clear, actionable items. Be concise.`,
            },
            {
              role: "user",
              content: `Extract tasks from this transcription:\n\n${input.transcription}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "task_extraction",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        tags: { type: "array", items: { type: "string" } },
                      },
                      required: ["title", "priority"],
                    },
                  },
                },
                required: ["tasks"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to extract tasks from LLM",
          });
        }

        const parsed = JSON.parse(content);
        const extractedTasks = parsed.tasks || [];

        // Insert extracted tasks into database
        const insertedTasks = [];
        for (const task of extractedTasks) {
          const created = await createTask(ctx.user.id, {
            recordingId: input.recordingId,
            title: task.title,
            description: task.description || null,
            priority: task.priority || "medium",
            status: "todo",
            tags: JSON.stringify(task.tags || []),
            extractedFrom: input.transcription.substring(0, 500),
          });

          if (created) {
            insertedTasks.push(created);
          }
        }

        return {
          success: true,
          count: insertedTasks.length,
          tasks: insertedTasks,
        };
      } catch (error) {
        console.error("[Tasks] Extract failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to extract tasks",
        });
      }
    }),

  /**
   * Get all tasks for the current user
   */
  getTasks: protectedProcedure
    .input(
      z.object({
        status: z.enum(["todo", "in_progress", "done", "cancelled"]).optional(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const userTasks = await getUserTasks(ctx.user.id, {
          status: input.status,
          priority: input.priority,
          limit: input.limit,
          offset: input.offset,
        });

        return {
          success: true,
          tasks: userTasks,
          count: userTasks.length,
        };
      } catch (error) {
        console.error("[Tasks] Get failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch tasks",
        });
      }
    }),

  /**
   * Update task status and priority
   */
  updateTask: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        status: z.enum(["todo", "in_progress", "done", "cancelled"]).optional(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const task = await getTaskById(input.taskId, ctx.user.id);
        if (!task) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found",
          });
        }

        const updated = await updateTask(input.taskId, ctx.user.id, {
          status: input.status,
          priority: input.priority,
          title: input.title,
          description: input.description,
          dueDate: input.dueDate,
        });

        return {
          success: true,
          task: updated,
        };
      } catch (error) {
        console.error("[Tasks] Update failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to update task",
        });
      }
    }),

  /**
   * Delete a task
   */
  deleteTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const success = await deleteTask(input.taskId, ctx.user.id);
        if (!success) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found",
          });
        }

        return { success: true };
      } catch (error) {
        console.error("[Tasks] Delete failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete task",
        });
      }
    }),

  /**
   * Get tasks sorted by priority (Magic Sort)
   */
  getTasksSorted: protectedProcedure
    .input(
      z.object({
        includeCompleted: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const sorted = await getTasksSortedByPriority(ctx.user.id, input.includeCompleted);

        return {
          success: true,
          tasks: sorted,
        };
      } catch (error) {
        console.error("[Tasks] Get sorted failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch sorted tasks",
        });
      }
    }),
});
