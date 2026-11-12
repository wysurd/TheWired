import { afterEach, expect, test, vi } from "vitest";
import {
  lessonHash,
  parseRoute,
  resumeSection,
  saveReadingPosition,
} from "./lessonNavigation";
afterEach(() => vi.unstubAllGlobals());
test("parses chapter URLs and safely defaults unknown pages and sections", () => {
  expect(parseRoute("#archive/transformer/mathematics")).toEqual({
    page: "archive",
    moduleId: "transformer",
    sectionId: "mathematics",
  });
  expect(parseRoute("#archive/neural/wrong").sectionId).toBe("foundations");
  expect(parseRoute("#bad").page).toBe("dashboard");
  expect(lessonHash("cnn", "implementation")).toBe(
    "archive/cnn/implementation",
  );
});
test("reading positions have their own key and fail safely", () => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key),
    setItem: (key: string, value: string) => store.set(key, value),
  });
  expect(saveReadingPosition("cnn", "advanced")).toBe(true);
  expect(resumeSection("cnn")).toBe("advanced");
  expect(store.has("wired-progress-v1")).toBe(false);
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw Error();
    },
    setItem: () => {
      throw Error();
    },
  });
  expect(resumeSection("cnn")).toBe("foundations");
  expect(saveReadingPosition("cnn", "advanced")).toBe(false);
});
