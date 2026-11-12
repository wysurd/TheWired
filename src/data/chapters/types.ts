export type SectionId =
  | "foundations"
  | "architecture"
  | "mathematics"
  | "worked-example"
  | "implementation"
  | "advanced"
  | "limitations"
  | "assessment";
export interface LessonSection {
  id: SectionId;
  title: string;
  paragraphs: string[];
  equation?: string;
  code?: string;
  language?: string;
  bullets?: string[];
  exercise?: { prompt: string; solution: string };
}
export interface Chapter {
  moduleId: string;
  objectives: string[];
  prerequisites: string[];
  sections: LessonSection[];
  references: { title: string; url: string }[];
}

export const sectionLabels: Record<SectionId, string> = {
  foundations: "Foundations",
  architecture: "Architecture",
  mathematics: "Mathematics",
  "worked-example": "Worked example",
  implementation: "Implementation",
  advanced: "Advanced",
  limitations: "Limitations",
  assessment: "Assessment",
};
