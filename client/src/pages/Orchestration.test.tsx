import { describe, it, expect, vi } from "vitest";

// Mock tRPC
vi.mock("@/lib/trpc", () => ({
  trpc: {
    orchestration: {
      getNotes: {
        useQuery: () => ({
          data: { notes: [] },
          isLoading: false,
          error: null,
        }),
      },
      getProjects: {
        useQuery: () => ({
          data: { projects: [] },
          isLoading: false,
          error: null,
        }),
      },
    },
    tasks: {
      getTasks: {
        useQuery: () => ({
          data: { tasks: [] },
          isLoading: false,
          error: null,
        }),
      },
    },
  },
}));

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

describe("Orchestration Component", () => {
  it("should be importable", async () => {
    const { Orchestration } = await import("./Orchestration");
    expect(Orchestration).toBeDefined();
  });

  it("should have proper structure", async () => {
    const { Orchestration } = await import("./Orchestration");
    const component = Orchestration.toString();
    
    expect(component).toContain("Tabs");
    expect(component).toContain("notes");
    expect(component).toContain("tasks");
    expect(component).toContain("projects");
  });
});
