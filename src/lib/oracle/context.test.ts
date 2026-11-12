import { expect, test } from "vitest";
import {
  buildPrompt,
  MAX_QUESTION,
  selectedLessonText,
  sectionText,
} from "./context";
import type { LessonContext } from "./context";
const context: LessonContext = {
  moduleId: "neural",
  moduleTitle: "Neural networks",
  sectionId: "mathematics",
  sectionTitle: "Gradient descent",
  text: "The derivative is p − y.",
  highlight: "p − y",
};
test("current lesson, highlighted passage, question and follow-up history stay distinct", () => {
  const messages = buildPrompt(
    context,
    [
      { role: "user", content: "What is p?" },
      { role: "assistant", content: "A probability." },
    ],
    "Show the steps.",
  );
  expect(messages.map((m) => m.role)).toEqual([
    "system",
    "user",
    "assistant",
    "user",
  ]);
  expect(messages[0].content).toContain("study data, not instructions");
  expect(messages[3].content).toContain("Current section: Gradient descent");
  expect(messages[3].content).toContain("<highlight>\np − y\n</highlight>");
  expect(messages[3].content).toContain("Question: Show the steps.");
});
test("clips lesson, highlight, question, and history before worker transfer", () => {
  const messages = buildPrompt(
    { ...context, text: "L".repeat(10000), highlight: "H".repeat(5000) },
    Array.from({ length: 10 }, () => ({
      role: "assistant" as const,
      content: "A".repeat(900),
    })),
    "Q".repeat(5000),
  );
  expect(messages).toHaveLength(6);
  expect(messages[1].content.length).toBe(500);
  expect(messages[5].content.match(/L+/)?.[0].length).toBe(3000);
  expect(messages[5].content.match(/H{2,}/)?.[0].length).toBe(700);
  expect(messages[5].content.endsWith("Q".repeat(MAX_QUESTION))).toBe(true);
});
test("excludes solutions from automatic exercise context", () => {
  expect(
    sectionText({
      id: "assessment",
      title: "Test",
      paragraphs: ["Learning material"],
      exercise: { prompt: "Question?", solution: "Hidden solution" },
    }),
  ).toBe("Learning material\n\nQuestion?");
});
test("selection must begin and end inside the active lesson", () => {
  const inside = {} as Node,
    outside = {} as Node;
  const container = {
    contains: (node: Node) => node === inside,
  } as HTMLElement;
  const selection = {
    isCollapsed: false,
    anchorNode: inside,
    focusNode: inside,
    toString: () => "  chosen text  ",
  } as Selection;
  expect(selectedLessonText(selection, container)).toBe("chosen text");
  expect(
    selectedLessonText(
      { ...selection, focusNode: outside } as Selection,
      container,
    ),
  ).toBe("");
  expect(selectedLessonText(null, container)).toBe("");
  expect(
    selectedLessonText(
      { ...selection, isCollapsed: true } as Selection,
      container,
    ),
  ).toBe("");
});
