import { afterEach, describe, expect, it, vi } from "vitest";
import { getLogBackSupport } from "@/lib/getLogBackSupport";
import { LOG_BACK_SUPPORT } from "@/models/LogBackSupport";
import { LOG_BACK_SUPPORT_ALL } from "@/models/resolveLogBackSupport";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getLogBackSupport (variable lue seulement si NODE_ENV=test)", () => {
  it("test + all : back livré simulé", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("LOG_BACK_SUPPORT_OVERRIDE", "all");
    expect(getLogBackSupport()).toBe(LOG_BACK_SUPPORT_ALL);
  });

  it("production ou développement : la variable est sans effet", () => {
    vi.stubEnv("LOG_BACK_SUPPORT_OVERRIDE", "all");
    for (const nodeEnv of ["production", "development"]) {
      vi.stubEnv("NODE_ENV", nodeEnv);
      expect(getLogBackSupport()).toBe(LOG_BACK_SUPPORT);
    }
  });

  it("sans variable : table du back actuel", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(getLogBackSupport()).toBe(LOG_BACK_SUPPORT);
  });
});
