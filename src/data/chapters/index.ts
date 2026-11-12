import { neural } from "./neural";
import { cnn } from "./cnn";
import { rnn } from "./rnn";
import { lstm } from "./lstm";
import { gnn } from "./gnn";
import { transformer } from "./transformer";
import { tree } from "./tree";
import { forest } from "./forest";
import type { Chapter } from "./types";
export const chapters: Record<string, Chapter> = Object.fromEntries(
  [neural, cnn, rnn, lstm, gnn, transformer, tree, forest].map((c) => [
    c.moduleId,
    c,
  ]),
);
