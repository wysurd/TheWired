import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Cpu,
  Download,
  Send,
  Square,
  Trash2,
} from "lucide-react";
import { buildPrompt, MAX_QUESTION } from "../lib/oracle/context";
import type { ChatMessage, LessonContext } from "../lib/oracle/context";
import type { OracleClient } from "../lib/oracle/client";
import {
  friendlyOracleError,
  MODEL_ID,
  unavailableReason,
} from "../lib/oracle/protocol";
import type { OracleState } from "../lib/oracle/protocol";
interface Turn extends ChatMessage {
  section: string;
}
export default function Oracle({
  context,
  onClearHighlight,
  onWorkedExample,
}: {
  context: LessonContext;
  onClearHighlight: () => void;
  onWorkedExample: () => void;
}) {
  const [state, setState] = useState<OracleState>("idle");
  const [status, setStatus] = useState("Dormant / no model loaded");
  const [download, setDownload] = useState(0),
    [question, setQuestion] = useState(""),
    [turns, setTurns] = useState<Turn[]>([]);
  const client = useRef<OracleClient | null>(null),
    session = useRef(0),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const liveState = useRef<OracleState>("idle");
  const updateState = (next: OracleState) => {
    liveState.current = next;
    setState(next);
  };
  function dispose() {
    session.current++;
    clearTimeout(timer.current);
    client.current?.dispose();
    client.current = null;
  }
  useEffect(
    () => () => {
      session.current++;
      clearTimeout(timer.current);
      client.current?.dispose();
    },
    [],
  );
  function fail(message: string) {
    dispose();
    updateState("error");
    setStatus(friendlyOracleError(message));
  }
  async function activate() {
    if (["checking", "loading", "generating"].includes(liveState.current))
      return;
    dispose();
    const id = session.current;
    updateState("checking");
    setStatus("Checking local WebGPU availability…");
    setDownload(0);
    try {
      const gpu = (
        navigator as Navigator & {
          gpu?: { requestAdapter: () => Promise<unknown> };
        }
      ).gpu;
      const memoryGB = (navigator as Navigator & { deviceMemory?: number })
        .deviceMemory;
      const adapter = gpu
        ? await Promise.race([
            gpu.requestAdapter(),
            new Promise((resolve) => setTimeout(() => resolve(null), 10000)),
          ])
        : null;
      if (id !== session.current) return;
      const reason = unavailableReason({
        secure: window.isSecureContext,
        gpu: !!gpu,
        adapter: !!adapter,
        memoryGB,
      });
      if (reason) {
        updateState("unsupported");
        setStatus(reason);
        return;
      }
      updateState("loading");
      setStatus("Loading local runtime, then downloading model artifacts…");
      const { createOracleClient } = await import("../lib/oracle/client");
      if (id !== session.current) return;
      client.current = createOracleClient((event) => {
        if (id !== session.current) return;
        if (event.type === "progress") {
          setDownload(Math.max(0, Math.min(1, event.progress)));
          setStatus(event.text);
        }
        if (event.type === "ready") {
          clearTimeout(timer.current);
          setDownload(1);
          updateState("ready");
          setStatus("Local model ready / questions stay on this device");
        }
        if (event.type === "token")
          setTurns((t) => {
            const last = t[t.length - 1];
            return last?.role === "assistant"
              ? [
                  ...t.slice(0, -1),
                  { ...last, content: last.content + event.text },
                ]
              : t;
          });
        if (event.type === "done") {
          clearTimeout(timer.current);
          updateState("ready");
          setStatus(
            "Generation finished / verify the explanation against the chapter",
          );
        }
        if (event.type === "error") fail(event.message);
      });
      timer.current = setTimeout(
        () => fail("Initialization timed out"),
        10 * 60 * 1000,
      );
      client.current.send({ type: "load" });
    } catch (error) {
      if (id === session.current)
        fail(error instanceof Error ? error.message : "Initialization failed");
    }
  }
  function send() {
    if (liveState.current !== "ready" || !question.trim() || !client.current)
      return;
    const current = question.trim().slice(0, MAX_QUESTION);
    const messages = buildPrompt(context, turns, current);
    setTurns((t) => [
      ...t.slice(-10),
      { role: "user", content: current, section: context.sectionTitle },
      { role: "assistant", content: "", section: context.sectionTitle },
    ]);
    setQuestion("");
    updateState("generating");
    setStatus("Generating locally on your GPU…");
    timer.current = setTimeout(
      () => fail("Generation stalled; local device unavailable"),
      2 * 60 * 1000,
    );
    client.current.send({ type: "generate", messages });
  }
  const busy = state === "loading" || state === "checking",
    generating = state === "generating";
  return (
    <aside className="oracle-panel panel" aria-label="The Oracle tutor">
      <div className="oracle-heading">
        <Cpu size={18} />
        <div>
          <h3>The Oracle</h3>
          <span>LOCAL AI / EXPERIMENTAL</span>
        </div>
        <span
          className={state === "ready" ? "status-dot" : "oracle-inactive"}
        />
      </div>
      <div className="oracle-body">
        <p className="oracle-disclosure">
          AI-generated explanations are separate from authored lessons. A small
          model can make factual and mathematical mistakes. Verify every
          derivation.
        </p>
        <div className="oracle-context">
          <span className="tiny green">CURRENT CONTEXT</span>
          <strong>{context.moduleTitle}</strong>
          <span>{context.sectionTitle}</span>
          <small>
            Current section (up to 3,000 characters), your selection, and up to
            four recent messages.
          </small>
          {context.highlight ? (
            <blockquote>
              <span>SELECTED TEXT</span>
              {context.highlight}
              <button className="text-button" onClick={onClearHighlight}>
                Clear selection
              </button>
            </blockquote>
          ) : (
            <small>
              Highlight text in the lesson to include it in your next question.
            </small>
          )}
        </div>
        <div className="oracle-status" role="status" aria-live="polite">
          <span className="tiny">{state.toUpperCase()}</span>
          <p>{status}</p>
        </div>
        {busy && (
          <>
            <progress
              aria-label="Model initialization progress"
              max="1"
              value={download}
            />
            <div className="tiny muted">
              {Math.round(download * 100)}% / download and GPU initialization
            </div>
          </>
        )}
        {["idle", "unsupported", "error"].includes(state) && (
          <div className="oracle-activation">
            <p>
              <strong>Qwen2.5 · 0.5B · 4-bit</strong>
              <br />
              Budget roughly 350–500 MB of downloads and at least 1.1 GB of
              available GPU memory. 4 GB+ system RAM recommended; 8 GB is safer.
              First load can take several minutes.
            </p>
            <p>
              Activation downloads open model files from Hugging Face and
              WebLLM’s runtime from GitHub. No paid API, account, or external
              inference. Questions are never sent to these hosts.
            </p>
            <button className="primary" onClick={() => void activate()}>
              <Download size={14} />
              {state === "idle" ? "Activate local model" : "Retry local model"}
            </button>
          </div>
        )}
        {(busy || state === "ready" || generating) && (
          <div className="oracle-runtime-actions">
            <button
              className="text-button"
              onClick={() => {
                dispose();
                updateState("idle");
                setStatus(
                  "Local runtime unloaded. Cached downloads may remain.",
                );
              }}
            >
              {busy ? "Cancel loading" : "Unload model"}
            </button>
            <span className="tiny muted">
              {MODEL_ID.includes("q4f32") ? "WEBGPU / FP32" : "WEBGPU"}
            </span>
          </div>
        )}
        {(state === "unsupported" || state === "error") && (
          <div className="oracle-fallback">
            <strong>Reading mode remains available</strong>
            <p>
              No AI answer has been substituted. Use the authored worked
              examples and expandable solutions.
            </p>
            <button className="text-button" onClick={onWorkedExample}>
              Open worked example <ArrowUpRight size={13} />
            </button>
          </div>
        )}
        <div
          className="oracle-conversation"
          aria-label="Oracle conversation"
          aria-busy={generating}
        >
          {turns.map((turn, i) => (
            <div key={i} className={`oracle-turn ${turn.role}`}>
              <div className="tiny">
                {turn.role === "assistant" ? "ORACLE / AI-GENERATED" : "YOU"}{" "}
                <span>· {turn.section}</span>
              </div>
              <p>
                {turn.content ||
                  (generating && i === turns.length - 1
                    ? "Thinking locally…"
                    : "No explanation generated.")}
              </p>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label htmlFor="oracle-question" className="tiny">
            ASK ABOUT THIS LESSON
          </label>
          <textarea
            id="oracle-question"
            rows={3}
            maxLength={MAX_QUESTION}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Walk me through this calculation…"
            disabled={state !== "ready"}
          />
          <div className="oracle-send">
            <button
              className="text-button"
              type="button"
              disabled={generating || !turns.length}
              onClick={() => setTurns([])}
            >
              <Trash2 size={12} /> Clear chat
            </button>
            {generating ? (
              <button
                className="secondary"
                type="button"
                onClick={() => {
                  client.current?.send({ type: "stop" });
                  setStatus("Stopping local generation…");
                }}
              >
                <Square size={12} /> Stop
              </button>
            ) : (
              <button
                className="secondary"
                type="submit"
                disabled={state !== "ready" || !question.trim()}
              >
                <Send size={13} /> Ask Oracle
              </button>
            )}
          </div>
        </form>
        <small className="oracle-cache-note">
          Closing the chapter releases the worker. Unloading releases the model,
          but browser caches may retain weights. Clear this site’s data in
          browser settings to remove cached files and learning progress.
        </small>
      </div>
    </aside>
  );
}
