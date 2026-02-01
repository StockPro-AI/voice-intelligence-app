import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("history router", () => {
  it("should create a recording history entry", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.history.create({
      audioUrl: "https://example.com/audio.mp3",
      transcription: "Test transcription",
      enrichedResult: "Test enriched result",
      enrichmentMode: "summary",
      transcriptionLanguage: "en",
      duration: 60,
      title: "Test Recording",
      notes: "Test notes",
    });

    expect(result).toBeDefined();
  });

  it("should list recording history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.history.list({
      limit: 50,
      offset: 0,
    });

    expect(result.recordings).toBeDefined();
    expect(Array.isArray(result.recordings)).toBe(true);
  });

  it("should toggle favorite status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a recording first
    const created = await caller.history.create({
      audioUrl: "https://example.com/audio.mp3",
      transcription: "Test transcription",
      transcriptionLanguage: "en",
    });

    // Get the ID from the result (assuming it returns insertId)
    if (created && typeof created === "object" && "insertId" in created) {
      const recordingId = created.insertId;

      // Toggle favorite
      const updated = await caller.history.toggleFavorite({
        id: recordingId,
        isFavorite: true,
      });

      expect(updated).toBeDefined();
    }
  });

  it("should get favorites", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.history.getFavorites({
      limit: 50,
      offset: 0,
    });

    expect(result.recordings).toBeDefined();
    expect(Array.isArray(result.recordings)).toBe(true);
  });
});
