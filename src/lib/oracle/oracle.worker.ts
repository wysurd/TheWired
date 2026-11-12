import { CreateMLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";
import type { MLCEngine } from "@mlc-ai/web-llm";
import { MODEL_ID } from "./protocol";
import type { OracleRequest, OracleEvent } from "./protocol";
let engine: MLCEngine | undefined;
let loading = false,
  generating = false;
const emit = (event: OracleEvent) => self.postMessage(event);
self.onmessage = async (event: MessageEvent<OracleRequest>) => {
  const request = event.data;
  if (request.type === "stop") {
    try {
      await engine?.interruptGenerate();
    } catch {
      emit({ type: "error", message: "Local generation could not be stopped" });
    }
    return;
  }
  if (request.type === "load") {
    if (loading || engine) return;
    loading = true;
    try {
      engine = await CreateMLCEngine(
        MODEL_ID,
        {
          appConfig: { ...prebuiltAppConfig, cacheBackend: "cache" },
          logLevel: "ERROR",
          initProgressCallback: (report) =>
            emit({
              type: "progress",
              progress: report.progress,
              text: report.text,
            }),
        },
        { context_window_size: 4096 },
      );
      emit({ type: "ready" });
    } catch (error) {
      emit({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Model initialization failed",
      });
    } finally {
      loading = false;
    }
  }
  if (request.type === "generate") {
    if (!engine || generating) return;
    generating = true;
    try {
      const chunks = await engine.chat.completions.create({
        messages: request.messages,
        stream: true,
        max_tokens: 384,
        temperature: 0.3,
        top_p: 0.9,
      });
      for await (const chunk of chunks) {
        const text = chunk.choices[0]?.delta.content;
        if (text) emit({ type: "token", text });
      }
      emit({ type: "done" });
    } catch (error) {
      emit({
        type: "error",
        message:
          error instanceof Error ? error.message : "Local generation failed",
      });
    } finally {
      generating = false;
    }
  }
};
