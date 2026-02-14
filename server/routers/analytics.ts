import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import {
  getWeekRecordings,
  getWeekCompletedTasks,
  calculateWeekMetrics,
  extractTopics,
  saveWeeklyAnalysis,
  getLatestWeeklyAnalysis,
  getWeeklyAnalysesByRange,
  getWeekBoundaries,
} from "../db-analytics";

/**
 * Analytics Router
 * Handles weekly analysis, trend detection, and project idea generation
 */
export const analyticsRouter = router({
  /**
   * Generate weekly analysis with LLM
   */
  generateWeeklyAnalysis: protectedProcedure
    .input(
      z.object({
        weekStartDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get week boundaries
        const { weekStart, weekEnd } = getWeekBoundaries(input.weekStartDate);

        // Get recordings and tasks for the week
        const recordings = await getWeekRecordings(ctx.user.id, weekStart, weekEnd);
        const completedTasks = await getWeekCompletedTasks(ctx.user.id, weekStart, weekEnd);

        if (recordings.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No recordings found for this week",
          });
        }

        // Calculate metrics
        const metrics = await calculateWeekMetrics(ctx.user.id, weekStart, weekEnd);
        if (!metrics) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to calculate metrics",
          });
        }

        // Extract topics
        const topTopics = extractTopics(recordings);
        const topicsText = Object.entries(topTopics)
          .map(([topic, count]) => `${topic} (${count})`)
          .join(", ");

        // Prepare transcription summary
        const transcriptionSummary = recordings
          .map((r) => r.transcription?.substring(0, 200))
          .filter(Boolean)
          .join("\n---\n");

        // Use LLM to generate analysis
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a productivity analyst. Analyze the user's weekly activity and generate:
              1. A concise summary of the week's productivity
              2. Key insights and patterns
              3. Actionable recommendations
              
              Respond with JSON containing: summary, insights, recommendations`,
            },
            {
              role: "user",
              content: `Weekly Activity Data:
              - Total Recordings: ${metrics.totalRecordings}
              - Recording Time: ${metrics.totalRecordingTime} minutes
              - Completed Tasks: ${metrics.completedTasks}
              - Top Topics: ${topicsText}
              - Tasks by Priority: Critical=${metrics.tasksByPriority.critical}, High=${metrics.tasksByPriority.high}, Medium=${metrics.tasksByPriority.medium}, Low=${metrics.tasksByPriority.low}
              
              Transcription Samples:
              ${transcriptionSummary}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "weekly_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "Weekly productivity summary" },
                  insights: { type: "string", description: "Key insights and patterns" },
                  recommendations: { type: "string", description: "Actionable recommendations" },
                },
                required: ["summary", "insights", "recommendations"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== "string") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate analysis from LLM",
          });
        }

        const analysis = JSON.parse(content);

        // Save analysis to database
        const saved = await saveWeeklyAnalysis(ctx.user.id, {
          weekStartDate: weekStart,
          summary: analysis.summary,
          topThemes: JSON.stringify(topTopics),
          projectIdeas: "", // Will be filled by generateProjectIdeas
          recommendations: analysis.recommendations,
          recordingCount: metrics.totalRecordings,
        });

        return {
          success: true,
          analysis: {
            ...analysis,
            metrics,
            topTopics,
            weekStart,
            weekEnd,
          },
          saved,
        };
      } catch (error) {
        console.error("[Analytics] Generate analysis failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to generate analysis",
        });
      }
    }),

  /**
   * Generate project ideas from weekly data
   */
  generateProjectIdeas: protectedProcedure
    .input(
      z.object({
        weekStartDate: z.date().optional(),
        topicFocus: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get week boundaries
        const { weekStart, weekEnd } = getWeekBoundaries(input.weekStartDate);

        // Get recordings for the week
        const recordings = await getWeekRecordings(ctx.user.id, weekStart, weekEnd);

        if (recordings.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No recordings found for this week",
          });
        }

        // Extract topics
        const topTopics = extractTopics(recordings);
        const topicsText = Object.entries(topTopics)
          .map(([topic, count]) => `${topic} (${count})`)
          .join(", ");

        // Prepare context
        const transcriptionContext = recordings
          .map((r) => r.transcription?.substring(0, 300))
          .filter(Boolean)
          .join("\n---\n");

        // Use LLM to generate project ideas
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a creative project ideation expert. Based on the user's weekly notes and activities, generate innovative and actionable project ideas.
              
              Return a JSON array of project ideas with: title, description, effort_level (low/medium/high), potential_impact (low/medium/high), skills_needed (array), estimated_timeline`,
            },
            {
              role: "user",
              content: `User's Weekly Activity:
              Topics discussed: ${topicsText}
              ${input.topicFocus ? `Focus area: ${input.topicFocus}` : ""}
              
              Key notes and discussions:
              ${transcriptionContext}
              
              Generate 3-5 innovative project ideas based on this data.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "project_ideas",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  ideas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        effort_level: { type: "string", enum: ["low", "medium", "high"] },
                        potential_impact: { type: "string", enum: ["low", "medium", "high"] },
                        skills_needed: { type: "array", items: { type: "string" } },
                        estimated_timeline: { type: "string" },
                      },
                      required: ["title", "description", "effort_level", "potential_impact"],
                    },
                  },
                },
                required: ["ideas"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== "string") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate project ideas from LLM",
          });
        }

        const parsed = JSON.parse(content);
        const ideas = parsed.ideas || [];

        return {
          success: true,
          ideas,
          topTopics,
          weekStart,
          weekEnd,
        };
      } catch (error) {
        console.error("[Analytics] Generate ideas failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to generate project ideas",
        });
      }
    }),

  /**
   * Get productivity trends
   */
  getTrends: protectedProcedure
    .input(
      z.object({
        weeks: z.number().min(1).max(12).default(4),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.weeks * 7);

        const analyses = await getWeeklyAnalysesByRange(ctx.user.id, startDate, endDate, input.weeks);

        // Calculate trends
        const trends = analyses.map((analysis) => ({
          week: analysis.weekStartDate.toISOString().split("T")[0],
          recordingCount: analysis.recordingCount,
          summary: analysis.summary,
          topThemes: analysis.topThemes ? JSON.parse(analysis.topThemes) : {},
        }));

        return {
          success: true,
          trends,
          totalWeeks: analyses.length,
        };
      } catch (error) {
        console.error("[Analytics] Get trends failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch trends",
        });
      }
    }),

  /**
   * Get latest analysis
   */
  getLatestAnalysis: protectedProcedure.query(async ({ ctx }) => {
    try {
      const analysis = await getLatestWeeklyAnalysis(ctx.user.id);

      if (!analysis) {
        return {
          success: false,
          analysis: null,
          message: "No analysis available yet",
        };
      }

      return {
        success: true,
        analysis: {
          ...analysis,
          topThemes: analysis.topThemes ? JSON.parse(analysis.topThemes) : {},
          projectIdeas: analysis.projectIdeas ? JSON.parse(analysis.projectIdeas) : [],
        },
      };
    } catch (error) {
      console.error("[Analytics] Get latest analysis failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch latest analysis",
      });
    }
  }),
});
