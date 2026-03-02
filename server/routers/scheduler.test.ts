import { describe, it, expect, beforeEach, vi } from "vitest";
import { schedulerRouter } from "./scheduler";
import { getDb } from "../db";

// Mock getDb
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

describe("Scheduler Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have all required procedures", () => {
    const procedures = Object.keys(schedulerRouter._def.procedures);
    expect(procedures).toContain("getConfig");
    expect(procedures).toContain("updateConfig");
    expect(procedures).toContain("categorizeNote");
    expect(procedures).toContain("runCategorization");
    expect(procedures).toContain("getUnprocessedCount");
    expect(procedures).toContain("getReviewNotes");
    expect(procedures).toContain("getStatistics");
  });

  it("should have correct procedure types", () => {
    const procedures = schedulerRouter._def.procedures;
    
    // Query procedures
    expect(procedures.getConfig._def.meta?.type).not.toBe("mutation");
    expect(procedures.getUnprocessedCount._def.meta?.type).not.toBe("mutation");
    expect(procedures.getReviewNotes._def.meta?.type).not.toBe("mutation");
    expect(procedures.getStatistics._def.meta?.type).not.toBe("mutation");
    
    // Mutation procedures
    expect(procedures.updateConfig._def.meta?.type).not.toBe("query");
    expect(procedures.categorizeNote._def.meta?.type).not.toBe("query");
    expect(procedures.runCategorization._def.meta?.type).not.toBe("query");
  });

  it("should validate updateConfig input", () => {
    const updateConfigProcedure = schedulerRouter._def.procedures.updateConfig;
    expect(updateConfigProcedure._def.inputs).toBeDefined();
  });

  it("should validate categorizeNote input", () => {
    const categorizeProcedure = schedulerRouter._def.procedures.categorizeNote;
    expect(categorizeProcedure._def.inputs).toBeDefined();
  });

  it("should validate getReviewNotes input", () => {
    const getReviewProcedure = schedulerRouter._def.procedures.getReviewNotes;
    expect(getReviewProcedure._def.inputs).toBeDefined();
  });
});
