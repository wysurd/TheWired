import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Cpu,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import type { Module } from "../data/modules";
import { chapters } from "../data/chapters";
import type { SectionId } from "../data/chapters/types";
import { sectionLabels } from "../data/chapters/types";
import { Quiz } from "./Interface";
import { saveReadingPosition, validSection } from "../lib/lessonNavigation";
import { sectionText, selectedLessonText } from "../lib/oracle/context";
const Oracle = lazy(() => import("./Oracle"));
interface Props {
  module: Module;
  sectionId: SectionId;
  completed: boolean;
  answer: number | null;
  onBack: () => void;
  onSection: (id: SectionId) => void;
  onComplete: () => void;
  onLab: () => void;
  onAnswer: (i: number) => void;
  onRetry: () => void;
}
export default function LessonReader({
  module,
  sectionId,
  completed,
  answer,
  onBack,
  onSection,
  onComplete,
  onLab,
  onAnswer,
  onRetry,
}: Props) {
  const chapter = chapters[module.id];
  const section = chapter.sections.find(
    (s) => s.id === validSection(sectionId),
  )!;
  const index = chapter.sections.indexOf(section);
  const [oracleOpen, setOracleOpen] = useState(false),
    [oracleMounted, setOracleMounted] = useState(false),
    [highlight, setHighlight] = useState(""),
    [positionSaved, setPositionSaved] = useState(true);
  const content = useRef<HTMLDivElement>(null),
    reading = useRef<HTMLElement>(null),
    firstRender = useRef(true);
  useEffect(() => {
    setHighlight("");
    setPositionSaved(saveReadingPosition(module.id, section.id));
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    reading.current?.focus({ preventScroll: true });
    reading.current?.scrollIntoView({ behavior: "instant", block: "start" });
  }, [module.id, section.id]);
  useEffect(() => {
    const capture = () => {
      const text = selectedLessonText(window.getSelection(), content.current);
      if (text) setHighlight(text);
    };
    document.addEventListener("selectionchange", capture);
    return () => document.removeEventListener("selectionchange", capture);
  }, []);
  const context = useMemo(
    () => ({
      moduleId: module.id,
      moduleTitle: module.title,
      sectionId: section.id,
      sectionTitle: section.title,
      text: sectionText(section),
      highlight,
    }),
    [module.id, module.title, section, highlight],
  );
  const toggle = () => {
    setOracleMounted(true);
    setOracleOpen((v) => !v);
  };
  return (
    <div className={`reading-workspace ${oracleOpen ? "with-oracle" : ""}`}>
      <div className="reader-topline">
        <button className="text-button" onClick={onBack}>
          <ArrowLeft size={13} /> Back to archive
        </button>
        <button
          className="secondary oracle-toggle"
          aria-expanded={oracleOpen}
          aria-controls="oracle-dock"
          onClick={toggle}
        >
          <Cpu size={14} />
          {oracleOpen ? "Collapse Oracle" : "Open The Oracle"}
          {oracleOpen ? (
            <PanelRightClose size={15} />
          ) : (
            <PanelRightOpen size={15} />
          )}
        </button>
      </div>
      <div className="reader-main">
        <article
          className="panel chapter-reader"
          ref={reading}
          tabIndex={-1}
          aria-label={`${module.title} chapter`}
        >
          <div className="chapter-heading">
            <div className="eyebrow">{module.category} / AUTHORED LESSON</div>
            <h2>{module.title}</h2>
            <p>{module.description}</p>
            <div className="chapter-objectives">
              <span className="tiny green">LEARNING OBJECTIVES</span>
              <ul>
                {chapter.objectives.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
              <span className="tiny muted">
                PREREQUISITES / {chapter.prerequisites.join(" · ")}
              </span>
            </div>
          </div>
          <nav className="chapter-toc" aria-label="Chapter sections">
            {chapter.sections.map((s, i) => (
              <button
                key={s.id}
                className={s.id === section.id ? "current" : ""}
                aria-current={s.id === section.id ? "step" : undefined}
                onClick={() => onSection(s.id)}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {sectionLabels[s.id]}
              </button>
            ))}
          </nav>
          <div className="chapter-content" ref={content} key={section.id}>
            <div className="section-index tiny">
              SECTION {String(index + 1).padStart(2, "0")} / 08{" "}
              <span>LESSON MATERIAL</span>
            </div>
            <h3>{section.title}</h3>
            {section.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {section.equation && (
              <figure className="equation">
                <figcaption>MATHEMATICAL MODEL</figcaption>
                <pre>{section.equation}</pre>
              </figure>
            )}
            {section.bullets && (
              <ul className="chapter-bullets">
                {section.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
            {section.code && (
              <figure className="code-example">
                <figcaption>
                  {section.language}{" "}
                  <span>REFERENCE CODE / RUN IN YOUR OWN ENVIRONMENT</span>
                </figcaption>
                <pre>
                  <code>{section.code}</code>
                </pre>
              </figure>
            )}
            {section.exercise && (
              <div className="chapter-exercise">
                <span className="tiny green">PAUSE & REASON</span>
                <p>{section.exercise.prompt}</p>
                <details>
                  <summary>Reveal worked solution</summary>
                  <p>{section.exercise.solution}</p>
                </details>
              </div>
            )}
            {section.id === "assessment" && (
              <>
                <Quiz
                  module={module}
                  answer={answer}
                  onAnswer={onAnswer}
                  onRetry={onRetry}
                />
                <div className="lesson-actions">
                  <button className="primary" onClick={onComplete}>
                    {completed ? (
                      <>
                        <Check size={15} /> Module completed
                      </>
                    ) : (
                      "Mark as complete"
                    )}
                  </button>
                  <button className="secondary" onClick={onLab}>
                    Explore the lab <ArrowUpRight size={14} />
                  </button>
                </div>
                <section className="chapter-references">
                  <h4>Go deeper / references</h4>
                  {chapter.references.map((r) => (
                    <a
                      key={r.url}
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {r.title}
                      <ArrowUpRight size={12} />
                    </a>
                  ))}
                </section>
              </>
            )}
          </div>
          {!positionSaved && (
            <p className="reading-save-warning" role="alert">
              Reading position could not be saved on this browser. Your lesson
              remains accessible.
            </p>
          )}
          <div className="chapter-pagination">
            <button
              className="text-button"
              disabled={index === 0}
              onClick={() => onSection(chapter.sections[index - 1].id)}
            >
              <ArrowLeft size={14} /> Previous section
            </button>
            <span className="tiny muted">{index + 1} / 8</span>
            {index < 7 ? (
              <button
                className="text-button"
                onClick={() => onSection(chapter.sections[index + 1].id)}
              >
                Next section <ArrowRight size={14} />
              </button>
            ) : (
              <button className="text-button" onClick={onBack}>
                Return to archive <ChevronRight size={14} />
              </button>
            )}
          </div>
        </article>
      </div>
      <div id="oracle-dock" className="oracle-dock" hidden={!oracleOpen}>
        {oracleMounted && (
          <Suspense
            fallback={
              <div className="panel oracle-loading" role="status">
                Opening The Oracle interface…
              </div>
            }
          >
            <Oracle
              context={context}
              onClearHighlight={() => setHighlight("")}
              onWorkedExample={() => onSection("worked-example")}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
