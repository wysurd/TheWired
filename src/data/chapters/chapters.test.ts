import { expect, test } from "vitest";
import { modules } from "../modules";
import { chapters } from "./index";
import { sectionIds } from "../../lib/lessonNavigation";
test("each existing module maps to a complete structured chapter", () => {
  expect(Object.keys(chapters).sort()).toEqual(modules.map((m) => m.id).sort());
  for (const module of modules) {
    const chapter = chapters[module.id];
    expect(chapter.sections.map((s) => s.id)).toEqual(sectionIds);
    expect(chapter.references.length).toBeGreaterThanOrEqual(2);
    expect(chapter.objectives.length).toBeGreaterThanOrEqual(3);
    expect(
      chapter.sections.find((s) => s.id === "implementation")?.code,
    ).toBeTruthy();
    expect(
      chapter.sections.find((s) => s.id === "worked-example")?.exercise,
    ).toBeTruthy();
  }
});
