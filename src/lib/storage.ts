export interface Progress {
  completed: string[];
  scores: Record<string, number>;
  bookmarks: string[];
}
export const emptyProgress: Progress = {
  completed: [],
  scores: {},
  bookmarks: [],
};
export function readProgress(): Progress {
  try {
    const v = JSON.parse(localStorage.getItem("wired-progress-v1") || "null");
    return {
      completed: Array.isArray(v?.completed)
        ? v.completed.filter((x: unknown) => typeof x === "string")
        : [],
      scores:
        v?.scores && typeof v.scores === "object"
          ? Object.fromEntries(
              Object.entries(v.scores).filter(
                (entry): entry is [string, number] =>
                  entry[1] === 0 || entry[1] === 1,
              ),
            )
          : {},
      bookmarks: Array.isArray(v?.bookmarks)
        ? v.bookmarks.filter((x: unknown) => typeof x === "string")
        : [],
    };
  } catch {
    return { ...emptyProgress };
  }
}
export function saveProgress(progress: Progress) {
  try {
    localStorage.setItem("wired-progress-v1", JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
