import type { SectionId } from "../data/chapters/types";
export const sectionIds: SectionId[] = [
  "foundations",
  "architecture",
  "mathematics",
  "worked-example",
  "implementation",
  "advanced",
  "limitations",
  "assessment",
];
export function validSection(id: string | undefined): SectionId {
  return sectionIds.includes(id as SectionId)
    ? (id as SectionId)
    : "foundations";
}
export function parseRoute(hash: string) {
  const [page, moduleId, sectionId] = hash.replace(/^#/, "").split("/");
  const safePage = [
    "dashboard",
    "archive",
    "lab",
    "research",
    "memory",
  ].includes(page)
    ? page
    : "dashboard";
  return {
    page: safePage,
    moduleId: safePage === "archive" ? moduleId : undefined,
    sectionId: validSection(sectionId),
  };
}
export function lessonHash(moduleId: string, section: SectionId): string {
  return `archive/${encodeURIComponent(moduleId)}/${section}`;
}
export function resumeSection(moduleId: string): SectionId {
  try {
    return validSection(
      localStorage.getItem(`wired-reading-v2:${moduleId}`) || undefined,
    );
  } catch {
    return "foundations";
  }
}
export function saveReadingPosition(
  moduleId: string,
  section: SectionId,
): boolean {
  try {
    localStorage.setItem(`wired-reading-v2:${moduleId}`, section);
    return true;
  } catch {
    return false;
  }
}
