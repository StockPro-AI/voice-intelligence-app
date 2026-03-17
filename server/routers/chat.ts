import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { chatHistory, notes as notesTable } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

export const chatRouter = router({
  // Send a message and get AI response with note context
  sendMessage: protectedProcedure
    .input(
      z.object({
        noteId: z.number(),
        message: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get the note context
      const noteRows = await db
        .select()
        .from(notesTable)
        .where(
          and(
            eq(notesTable.id, input.noteId),
            eq(notesTable.userId, ctx.user.id)
          )
        )
        .limit(1);

      const note = noteRows[0];
      if (!note) {
        throw new Error("Note not found");
      }

      // Create system prompt with note context
      const systemPrompt = `You are a helpful assistant analyzing the user's notes. 
Here is the note content for context:

Title: ${note.title || "Untitled"}
Content: ${note.content}

Category: ${note.category}
Status: ${note.status}
${note.tags ? `Tags: ${note.tags}` : ""}

Please answer the user's question based on this note content. Be concise and helpful.`;

      // Call LLM with streaming
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input.message },
        ],
      });

      const assistantMessage =
        response.choices[0]?.message?.content || "No response generated";

      // Save user message to chat history
      const assistantMsg = assistantMessage as string;
      await db.insert(chatHistory).values({
        userId: ctx.user.id,
        recordingId: null,
        role: "user",
        message: input.message,
        metadata: JSON.stringify({ noteId: input.noteId }),
        createdAt: new Date(),
      });

      // Save assistant message to chat history
      await db.insert(chatHistory).values({
        userId: ctx.user.id,
        recordingId: null,
        role: "assistant",
        message: assistantMsg,
        metadata: JSON.stringify({ noteId: input.noteId }),
        createdAt: new Date(),
      });

      return {
        userMessage: input.message,
        assistantMessage: assistantMessage,
        timestamp: new Date(),
      };
    }),

  // Get chat history for a note
  getChatHistory: protectedProcedure
    .input(z.object({ noteId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify note belongs to user
      const noteRows = await db
        .select()
        .from(notesTable)
        .where(
          and(
            eq(notesTable.id, input.noteId),
            eq(notesTable.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (noteRows.length === 0) {
        throw new Error("Note not found");
      }

      // Get chat history for this note
      const history = await db
        .select()
        .from(chatHistory)
        .where(eq(chatHistory.userId, ctx.user.id))
        .orderBy(desc(chatHistory.createdAt))
        .limit(100);

      // Filter by noteId from metadata
      const filteredHistory = history.filter((h) => {
        try {
          const metadata = h.metadata ? JSON.parse(h.metadata) : {};
          return metadata.noteId === input.noteId;
        } catch {
          return false;
        }
      });

      return filteredHistory.reverse();
    }),

  // Delete chat history for a note
  deleteChatHistory: protectedProcedure
    .input(z.object({ noteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify note belongs to user
      const noteRows = await db
        .select()
        .from(notesTable)
        .where(
          and(
            eq(notesTable.id, input.noteId),
            eq(notesTable.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (noteRows.length === 0) {
        throw new Error("Note not found");
      }

      // Get all chat history for this user
      const allHistory = await db
        .select()
        .from(chatHistory)
        .where(eq(chatHistory.userId, ctx.user.id));

      // Find IDs to delete based on noteId in metadata
      const idsToDelete = allHistory
        .filter((h) => {
          try {
            const metadata = h.metadata ? JSON.parse(h.metadata) : {};
            return metadata.noteId === input.noteId;
          } catch {
            return false;
          }
        })
        .map((h) => h.id);

      // Delete chat history entries
      for (const id of idsToDelete) {
        await db.delete(chatHistory).where(eq(chatHistory.id, id));
      }

      return { success: true, deletedCount: idsToDelete.length };
    }),
});
