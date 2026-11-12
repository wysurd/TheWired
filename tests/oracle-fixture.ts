import type { Page } from "@playwright/test";
// Deterministic worker double: these tests verify the UI/protocol, NOT real inference.
export async function mockLocalRuntime(
  page: Page,
  mode:
    | "ready"
    | "download-error"
    | "memory-error"
    | "loading"
    | "slow-generation" = "ready",
) {
  await page.addInitScript(
    ({ mode }) => {
      Object.defineProperty(navigator, "gpu", {
        configurable: true,
        value: { requestAdapter: async () => ({}) },
      });
      Object.defineProperty(navigator, "deviceMemory", {
        configurable: true,
        value: 8,
      });
      const original = window.Worker;
      const state = window as unknown as {
        oracleRequests: unknown[];
        oracleWorkers: number;
        oracleDisposed: number;
      };
      state.oracleRequests = [];
      state.oracleWorkers = 0;
      state.oracleDisposed = 0;
      class LocalWorkerDouble {
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror = null;
        onmessageerror = null;
        dead = false;
        emit(data: unknown) {
          setTimeout(() => {
            if (!this.dead) this.onmessage?.({ data } as MessageEvent);
          }, 20);
        }
        postMessage(request: { type: string }) {
          state.oracleRequests.push(request);
          if (request.type === "load") {
            this.emit({
              type: "progress",
              progress: 0.45,
              text: "Test fixture: downloading 45%",
            });
            if (mode === "download-error")
              this.emit({ type: "error", message: "fetch failed" });
            else if (mode === "memory-error")
              this.emit({
                type: "error",
                message: "GPU device lost: out of memory",
              });
            else if (mode !== "loading") this.emit({ type: "ready" });
          }
          if (request.type === "generate") {
            this.emit({
              type: "token",
              text: "Test-only generated explanation.",
            });
            if (mode !== "slow-generation") this.emit({ type: "done" });
          }
          if (request.type === "stop") this.emit({ type: "done" });
        }
        terminate() {
          this.dead = true;
          state.oracleDisposed++;
        }
      }
      window.Worker = new Proxy(original, {
        construct(target, args) {
          if (String(args[0]).includes("oracle.worker")) {
            state.oracleWorkers++;
            return new LocalWorkerDouble();
          }
          return Reflect.construct(target, args);
        },
      });
    },
    { mode },
  );
}
