import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Check,
  ChevronRight,
  Cpu,
  ExternalLink,
  Github,
  Layers,
  LayoutDashboard,
  Menu,
  Network as NetworkIcon,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Search,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import { modules } from "./data/modules";
import type { Module } from "./data/modules";
import { Stat, PanelTitle } from "./components/Interface";
import { Network } from "./components/Network";
import { readProgress, saveProgress } from "./lib/storage";
import { fetchArticles, initialArticles } from "./lib/research";
import type { Article } from "./lib/research";
import { lessonHash, parseRoute, resumeSection } from "./lib/lessonNavigation";
import type { SectionId } from "./data/chapters/types";
const LessonReader = lazy(() => import("./components/LessonReader"));
const nav = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "archive", label: "Knowledge Archive", icon: BookOpen },
  { id: "lab", label: "Simulation Lab", icon: NetworkIcon },
  { id: "research", label: "Research Signal", icon: Radio },
  { id: "memory", label: "Memory Bank", icon: Cpu },
];
type Page = (typeof nav)[number]["id"];
function App() {
  const [page, setPage] = useState<Page>(() => parseRoute(location.hash).page);
  const [mobile, setMobile] = useState(false),
    [progress, setProgress] = useState(readProgress),
    [storageOk, setStorageOk] = useState(true);
  const [selected, setSelected] = useState<Module | null>(
      () =>
        modules.find((m) => m.id === parseRoute(location.hash).moduleId) ||
        null,
    ),
    [answer, setAnswer] = useState<number | null>(null),
    [query, setQuery] = useState("");
  const [sectionRoute, setSectionRoute] = useState<SectionId>(
    () => parseRoute(location.hash).sectionId,
  );
  const [layers, setLayers] = useState(2),
    [neurons, setNeurons] = useState(6),
    [running, setRunning] = useState(true);
  const [articles, setArticles] = useState<Article[]>(initialArticles),
    [feedStatus, setFeedStatus] = useState("Curated foundational papers"),
    [refreshing, setRefreshing] = useState(false),
    [auto, setAuto] = useState(false),
    [live, setLive] = useState(false);
  const controller = useRef<AbortController | null>(null),
    busy = useRef(false);
  useEffect(() => {
    setStorageOk(saveProgress(progress));
  }, [progress]);
  useEffect(() => {
    const f = () => {
      const route = parseRoute(location.hash);
      setPage(route.page);
      setSelected(modules.find((m) => m.id === route.moduleId) || null);
      setSectionRoute(route.sectionId);
      setAnswer(null);
      setQuery("");
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  async function refresh() {
    if (busy.current) return;
    busy.current = true;
    setRefreshing(true);
    const c = new AbortController();
    controller.current = c;
    const timeout = setTimeout(() => c.abort(), 15000);
    try {
      const fresh = await fetchArticles(c.signal);
      setArticles(fresh);
      setLive(true);
      setFeedStatus(
        `Live Europe PMC · refreshed ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      );
    } catch {
      setFeedStatus(
        "Live source unavailable · showing retained papers. Try again later.",
      );
    } finally {
      clearTimeout(timeout);
      busy.current = false;
      setRefreshing(false);
    }
  }
  useEffect(() => {
    if (!auto) return;
    void refresh();
    const t = setInterval(() => void refresh(), 300000);
    return () => clearInterval(t);
  }, [auto]);
  useEffect(() => () => controller.current?.abort(), []);
  const go = (id: Page) => {
    location.hash = id;
    setPage(id);
    setMobile(false);
    setSelected(null);
    setQuery("");
    window.scrollTo(0, 0);
  };
  const open = (m: Module) => {
    const section = resumeSection(m.id);
    location.hash = lessonHash(m.id, section);
    setPage("archive");
    setAnswer(null);
    setSelected(m);
    setSectionRoute(section);
    window.scrollTo(0, 0);
  };
  const toggleBookmark = (id: string) =>
    setProgress((p) => ({
      ...p,
      bookmarks: p.bookmarks.includes(id)
        ? p.bookmarks.filter((x) => x !== id)
        : [...p.bookmarks, id],
    }));
  const complete = (id: string) =>
    setProgress((p) => ({
      ...p,
      completed: p.completed.includes(id) ? p.completed : [...p.completed, id],
    }));
  const next =
    modules.find((m) => !progress.completed.includes(m.id)) || modules[0];
  const learned = modules.filter((m) =>
    progress.completed.includes(m.id),
  ).length;
  const correct = Object.values(progress.scores).filter((x) => x === 1).length;
  const filtered = modules.filter((m) =>
    `${m.title} ${m.category} ${m.description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const heading = nav.find((n) => n.id === page)!;
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <aside className={mobile ? "sidebar mobile-open" : "sidebar"}>
        <a className="brand" href="#dashboard" onClick={() => go("dashboard")}>
          <span className="brand-symbol">
            W<span>_</span>
          </span>
          <span>
            THE WIRED<small>PERSONAL RESEARCH SYSTEM</small>
          </span>
        </a>
        <div className="workspace-label">
          WORKSPACE <span>01</span>
        </div>
        <nav aria-label="Main navigation">
          {nav.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? "nav-item active" : "nav-item"}
              onClick={() => go(n.id)}
            >
              <n.icon size={17} />
              {n.label}
              {page === n.id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="system-box">
            <span className="tiny">
              <i className="status-dot" /> LOCAL SYSTEM ONLINE
            </span>
            <p>Your mind. Extended.</p>
            <div className="system-bars">▂ ▃ ▂ ▅ ▃ ▆ ▄ ▂ ▄ ▅ ▃ ▂ ▅ ▄ ▆ ▃ ▂</div>
          </div>
          <a
            className="source-link"
            href="https://github.com/wysurd/TheWired"
            target="_blank"
            rel="noreferrer"
          >
            <Github size={15} /> Source code <ArrowUpRight size={13} />
          </a>
          <div className="version">
            THE WIRED <span>v0.2.0 / LOCAL FIRST</span>
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-toggle"
              aria-label="Toggle navigation"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={20} />
            </button>
            <Terminal size={15} />
            <span>workspace</span>
            <span className="slash">/</span>
            <strong>{heading.label.toLowerCase().replaceAll(" ", "-")}</strong>
          </div>
          <div className="top-status">
            <span className="status-dot" /> SYSTEM OPERATIONAL{" "}
            <span className="top-divider" /> <span>LOCAL SESSION</span>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} key={page}>
          {!storageOk && (
            <div className="notice" role="alert">
              Browser storage is unavailable. Progress works for this session
              but cannot be saved.
            </div>
          )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span />{" "}
                {page === "dashboard"
                  ? "YOUR CONNECTION TO THE WIRED"
                  : `THE WIRED / ${heading.label.toUpperCase()}`}
              </div>
              <h1>
                {page === "dashboard"
                  ? "Welcome back, operator."
                  : heading.label}
                <span className="cursor">_</span>
              </h1>
              <p>
                {page === "dashboard"
                  ? "A quiet place to understand intelligent systems."
                  : page === "archive"
                    ? "Build your mental models. One architecture at a time."
                    : page === "lab"
                      ? "Make the invisible visible. Explore a network from the inside."
                      : page === "research"
                        ? "Tune into the ideas shaping intelligent systems."
                        : "Knowledge fades. Give it somewhere to live."}
              </p>
            </div>
            <div className="session-chip">
              <span className="status-dot" />{" "}
              {page === "dashboard"
                ? "SESSION / 001"
                : "WORKSPACE / 0" + (nav.findIndex((n) => n.id === page) + 1)}
            </div>
          </div>
          {page === "dashboard" && (
            <>
              <section className="stats-grid" aria-label="Learning statistics">
                <Stat
                  label="LEARNING PROGRESS"
                  value={`${Math.round((learned / 8) * 100)}%`}
                  sub={`${learned} of 8 modules completed`}
                  icon={<BookOpen size={17} />}
                >
                  <div className="progress-track">
                    <span style={{ width: `${(learned / 8) * 100}%` }} />
                  </div>
                </Stat>
                <Stat
                  label="KNOWLEDGE RETENTION"
                  value={`${correct}`}
                  suffix="/ 8"
                  sub="Quiz questions mastered"
                  icon={<Cpu size={17} />}
                >
                  <span className="stat-note">
                    {correct ? "MEMORY ENCODED" : "AWAITING FIRST CHECKPOINT"}{" "}
                    <ArrowUpRight size={12} />
                  </span>
                </Stat>
                <Stat
                  label="RESEARCH SIGNALS"
                  value={String(articles.length).padStart(2, "0")}
                  sub={
                    live
                      ? "Articles from Europe PMC"
                      : "Foundational papers to explore"
                  }
                  icon={<Radio size={17} />}
                >
                  <span className="stat-note">
                    <span className="status-dot" />{" "}
                    {live ? "LIVE SOURCE CONNECTED" : "CURATED FREQUENCY"}
                  </span>
                </Stat>
              </section>
              <div className="dashboard-grid">
                <section className="panel continue-panel">
                  <PanelTitle
                    icon={<BookOpen size={15} />}
                    title="CONTINUE LEARNING"
                    right="KNOWLEDGE ARCHIVE"
                  />
                  <div className="continue-content">
                    <span className="tag">
                      {next.category}{" "}
                      <span>
                        {" "}
                        / {String(modules.indexOf(next) + 1).padStart(2, "0")}
                      </span>
                    </span>
                    <h2>{next.title}</h2>
                    <p>
                      {next.description} Explore the mechanisms behind machine
                      intelligence.
                    </p>
                    <div className="lesson-meta">
                      <span>
                        <Layers size={13} /> 8 SECTIONS + CHECKPOINT
                      </span>
                      <span>~{next.minutes} MIN</span>
                    </div>
                    <button className="primary" onClick={() => open(next)}>
                      {learned === 8 ? "Revisit module" : "Enter module"}{" "}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="chapter-progress">
                    {modules.map((m) => (
                      <span
                        key={m.id}
                        className={
                          progress.completed.includes(m.id) ? "done" : ""
                        }
                      />
                    ))}
                    <span>{learned}/8</span>
                  </div>
                </section>
                <section className="panel lab-preview">
                  <PanelTitle
                    icon={<NetworkIcon size={15} />}
                    title="NEURAL PLAYGROUND"
                    right={
                      <span className="tiny green">
                        <span className="status-dot" /> INTERACTIVE
                      </span>
                    }
                  />
                  <div className="preview-network">
                    <div className="coordinate top-left">
                      NET_001 / MULTILAYER PERCEPTRON
                    </div>
                    <Network compact />
                    <div className="coordinate bottom-right">4 → 6 → 6 → 3</div>
                  </div>
                  <div className="panel-bottom">
                    <div>
                      <h3>Ideas become connections.</h3>
                      <p>Change the architecture. Follow the signal.</p>
                    </div>
                    <button
                      className="square-button"
                      aria-label="Open simulation lab"
                      onClick={() => go("lab")}
                    >
                      <ArrowUpRight size={20} />
                    </button>
                  </div>
                </section>
              </div>
              <section className="panel research-preview">
                <PanelTitle
                  icon={<Radio size={15} />}
                  title="ON THE FREQUENCY"
                  right={
                    <button
                      className="text-button"
                      onClick={() => go("research")}
                    >
                      All signals <ArrowRight size={13} />
                    </button>
                  }
                />
                {articles.slice(0, 3).map((a, i) => (
                  <div className="signal-row" key={a.id}>
                    <span className="row-number">0{i + 1}</span>
                    <div className="signal-details">
                      <span className="tiny muted">{a.category}</span>
                      <a href={a.url} target="_blank" rel="noreferrer">
                        {a.title} <ArrowUpRight size={14} />
                      </a>
                      <span className="signal-author">{a.authors}</span>
                    </div>
                    <span className="signal-date">{a.date}</span>
                    <button
                      className={
                        "bookmark " +
                        (progress.bookmarks.includes(a.id) ? "saved" : "")
                      }
                      aria-label={`${progress.bookmarks.includes(a.id) ? "Unsave" : "Save"} ${a.title}`}
                      onClick={() => toggleBookmark(a.id)}
                    >
                      <Bookmark size={16} />
                    </button>
                  </div>
                ))}
              </section>
              <div className="quote">
                <span>“</span>We are all connected.
                <small>STAY CURIOUS. STAY CONNECTED.</small>
                <div className="quote-grid" />
              </div>
            </>
          )}
          {page === "archive" && !selected && (
            <>
              <div className="section-toolbar">
                <span className="tiny muted">
                  08 MODULES / FROM FIRST PRINCIPLES
                </span>
                <label className="search">
                  <Search size={15} />
                  <input
                    aria-label="Search modules"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search the archive…"
                  />
                </label>
              </div>
              <div className="module-grid">
                {filtered.map((m, i) => (
                  <button
                    className="panel module-card"
                    key={m.id}
                    onClick={() => open(m)}
                  >
                    <div className="module-top">
                      <span className="tiny">
                        {String(modules.indexOf(m) + 1).padStart(2, "0")} /{" "}
                        {m.category}
                      </span>
                      {progress.completed.includes(m.id) ? (
                        <Check size={17} className="green" />
                      ) : (
                        <ArrowUpRight size={17} />
                      )}
                    </div>
                    <div className="module-glyph" aria-hidden="true">
                      {["◉", "▦", "↻", "⊞", "⌘", "✳", "⑂", "♧"][i % 8]}
                    </div>
                    <h2>{m.title}</h2>
                    <p>{m.description}</p>
                    <div className="module-footer">
                      <span>{m.minutes} MIN READ</span>
                      <span>
                        {progress.completed.includes(m.id)
                          ? "COMPLETED"
                          : "EXPLORE MODULE"}{" "}
                        <ChevronRight size={12} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {!filtered.length && (
                <p className="empty">
                  No modules match “{query}”. Try another search.
                </p>
              )}
            </>
          )}
          {page === "archive" && selected && (
            <Suspense
              fallback={
                <div className="notice" role="status">
                  Opening chapter…
                </div>
              }
            >
              <LessonReader
                key={selected.id}
                module={selected}
                sectionId={sectionRoute}
                completed={progress.completed.includes(selected.id)}
                answer={answer}
                onBack={() => go("archive")}
                onSection={(id) => {
                  location.hash = lessonHash(selected.id, id);
                  setSectionRoute(id);
                  setAnswer(null);
                }}
                onComplete={() => complete(selected.id)}
                onLab={() => go("lab")}
                onRetry={() => setAnswer(null)}
                onAnswer={(i) => {
                  setAnswer(i);
                  setProgress((p) => ({
                    ...p,
                    scores: {
                      ...p.scores,
                      [selected.id]: i === selected.correct ? 1 : 0,
                    },
                  }));
                }}
              />
            </Suspense>
          )}
          {page === "lab" && (
            <>
              <section className="panel full-lab">
                <PanelTitle
                  icon={<NetworkIcon size={15} />}
                  title="ARCHITECTURE EXPLORER"
                  right={
                    <span className="tiny green">
                      {running ? "SIGNAL ACTIVE" : "SIGNAL PAUSED"}
                    </span>
                  }
                />
                <div className="lab-canvas">
                  <div className="coordinate top-left">
                    FEEDFORWARD / FULLY CONNECTED
                  </div>
                  <Network
                    layers={[4, ...Array(layers).fill(neurons), 3]}
                    active={running}
                  />
                </div>
                <div className="lab-controls">
                  <label>
                    HIDDEN LAYERS <strong>{layers}</strong>
                    <input
                      type="range"
                      aria-label="Hidden layers"
                      min="1"
                      max="5"
                      value={layers}
                      onChange={(e) => setLayers(+e.target.value)}
                    />
                  </label>
                  <label>
                    NEURONS PER LAYER <strong>{neurons}</strong>
                    <input
                      type="range"
                      aria-label="Neurons per layer"
                      min="2"
                      max="10"
                      value={neurons}
                      onChange={(e) => setNeurons(+e.target.value)}
                    />
                  </label>
                  <button
                    className="secondary"
                    onClick={() => setRunning(!running)}
                  >
                    {running ? <Pause size={15} /> : <Play size={15} />}{" "}
                    {running ? "Pause signal" : "Resume signal"}
                  </button>
                  <button
                    className="text-button"
                    onClick={() => {
                      setLayers(2);
                      setNeurons(6);
                      setRunning(true);
                    }}
                  >
                    Reset <RefreshCw size={14} />
                  </button>
                </div>
              </section>
              <div className="stats-grid lab-stats">
                <Stat
                  label="TOTAL NEURONS"
                  value={String(7 + layers * neurons)}
                  sub="4 input + hidden + 3 output"
                  icon={<Cpu size={17} />}
                />
                <Stat
                  label="CONNECTIONS"
                  value={String(7 * neurons + (layers - 1) * neurons * neurons)}
                  sub="Weighted edges between adjacent layers"
                  icon={<Activity size={17} />}
                />
                <Stat
                  label="TRAINABLE PARAMETERS"
                  value={String(
                    7 * neurons +
                      (layers - 1) * neurons * neurons +
                      layers * neurons +
                      3,
                  )}
                  sub="Connection weights + hidden/output biases"
                  icon={<Layers size={17} />}
                />
              </div>
              <div className="notice">
                This is an architecture visualization. Pulsing nodes illustrate
                signal flow; no model training or inference is performed. Every
                neuron connects to every neuron in the next layer.
              </div>
            </>
          )}
          {page === "research" && (
            <>
              <div className="section-toolbar feed-toolbar">
                <div>
                  <span className="tiny green">
                    {live ? "LIVE RESEARCH" : "FOUNDATIONAL COLLECTION"}
                  </span>
                  <p className="muted feed-state" role="status">
                    {feedStatus}
                  </p>
                </div>
                <div className="feed-buttons">
                  <label className="auto-refresh">
                    <input
                      type="checkbox"
                      checked={auto}
                      onChange={(e) => setAuto(e.target.checked)}
                    />{" "}
                    Auto / 5 min
                  </label>
                  <button
                    className="secondary"
                    disabled={refreshing}
                    onClick={() => void refresh()}
                  >
                    <RefreshCw className={refreshing ? "spin" : ""} size={14} />
                    {refreshing ? "Receiving…" : "Refresh live feed"}
                  </button>
                </div>
              </div>
              <p className="source-note">
                Live feed: recent deep-learning research indexed by Europe PMC,
                including biomedical applications. Curated papers are provided
                until you connect. No API key required.
              </p>
              <div className="article-grid">
                {articles.map((a) => (
                  <article className="panel article-card" key={a.id}>
                    <div className="module-top">
                      <span className="tag">{a.category}</span>
                      <button
                        className={
                          "bookmark " +
                          (progress.bookmarks.includes(a.id) ? "saved" : "")
                        }
                        aria-label={`${progress.bookmarks.includes(a.id) ? "Unsave" : "Save"} ${a.title}`}
                        onClick={() => toggleBookmark(a.id)}
                      >
                        <Bookmark size={17} />
                      </button>
                    </div>
                    <h2>
                      <a href={a.url} target="_blank" rel="noreferrer">
                        {a.title}
                      </a>
                    </h2>
                    <p>{a.summary}</p>
                    <div className="article-meta">
                      {a.authors} · {a.date}
                    </div>
                    <a
                      className="text-button"
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Read paper <ExternalLink size={13} />
                    </a>
                  </article>
                ))}
              </div>
            </>
          )}
          {page === "memory" && (
            <>
              <div className="stats-grid">
                <Stat
                  label="MODULES COMPLETED"
                  value={String(learned)}
                  suffix="/ 8"
                  sub="Read, understand, connect."
                  icon={<BookOpen size={17} />}
                />
                <Stat
                  label="CHECKPOINTS MASTERED"
                  value={String(correct)}
                  suffix="/ 8"
                  sub="Latest answer for each module"
                  icon={<Cpu size={17} />}
                />
                <Stat
                  label="SAVED PAPERS"
                  value={String(progress.bookmarks.length)}
                  sub="Stored on this browser"
                  icon={<Bookmark size={17} />}
                />
              </div>
              <section className="panel memory-section">
                <PanelTitle
                  icon={<Cpu size={15} />}
                  title="RETRIEVAL PRACTICE"
                  right="08 CHECKPOINTS"
                />
                <p className="muted">
                  Test your understanding. Choose a module to review and answer
                  its checkpoint.
                </p>
                {modules.map((m) => (
                  <button
                    className="memory-row"
                    key={m.id}
                    onClick={() => open(m)}
                  >
                    <span
                      className={
                        progress.scores[m.id] === 1
                          ? "checkpoint mastered"
                          : "checkpoint"
                      }
                    >
                      {progress.scores[m.id] === 1 ? (
                        <Check size={15} />
                      ) : (
                        <span>?</span>
                      )}
                    </span>
                    <div>
                      <strong>{m.title}</strong>
                      <small>
                        {progress.scores[m.id] === 1
                          ? "MASTERED"
                          : progress.scores[m.id] === 0
                            ? "REVISIT THIS CONCEPT"
                            : "NOT ATTEMPTED"}
                      </small>
                    </div>
                    <ArrowRight size={16} />
                  </button>
                ))}
              </section>
              <section className="panel memory-section">
                <PanelTitle
                  icon={<Bookmark size={15} />}
                  title="SAVED SIGNALS"
                  right={`${progress.bookmarks.length} SAVED`}
                />
                {progress.bookmarks.length ? (
                  progress.bookmarks.map((id) => {
                    const a = [...articles, ...initialArticles].find(
                      (a) => a.id === id,
                    );
                    const [source, paperId] = id.split(":");
                    return (
                      <div className="saved-row" key={id}>
                        <a
                          href={
                            a?.url ||
                            (paperId
                              ? `https://europepmc.org/article/${encodeURIComponent(source)}/${encodeURIComponent(paperId)}`
                              : `https://arxiv.org/abs/${encodeURIComponent(id)}`)
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          {a?.title || `Saved paper / ${id}`}{" "}
                          <ExternalLink size={13} />
                        </a>
                        <button
                          aria-label={`Remove saved paper ${a?.title || id}`}
                          className="bookmark"
                          onClick={() => toggleBookmark(id)}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty">
                    <Bookmark size={24} />
                    <p>Keep a signal worth returning to.</p>
                    <button
                      className="text-button"
                      onClick={() => go("research")}
                    >
                      Explore research <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </section>
              <div className="memory-privacy">
                <span>
                  LOCAL FIRST / Your progress is stored only in this browser.
                </span>
                <button
                  className="text-button danger"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Reset all learning progress, quiz results, and saved papers on this browser?",
                      )
                    )
                      setProgress({ completed: [], scores: {}, bookmarks: [] });
                  }}
                >
                  <Trash2 size={13} /> Reset memory
                </button>
              </div>
            </>
          )}
          <footer>
            <span>
              <span className="status-dot" /> ALL SYSTEMS WITHIN YOU
            </span>
            <span>
              THE WIRED / <span className="muted">VERSION 0.2</span>
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
export default App;
