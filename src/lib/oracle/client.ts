import type { OracleEvent, OracleRequest } from "./protocol";
export interface OracleClient {
  send: (message: OracleRequest) => void;
  dispose: () => void;
}
// This module has no WebLLM import. The worker and its AI dependency are fetched
// only when createOracleClient is called after explicit user activation.
export function createOracleClient(
  onEvent: (event: OracleEvent) => void,
): OracleClient {
  const worker = new Worker(new URL("./oracle.worker.ts", import.meta.url), {
    type: "module",
    name: "the-oracle-local",
  });
  worker.onmessage = (e: MessageEvent<OracleEvent>) => onEvent(e.data);
  worker.onerror = (event) => {
    event.preventDefault();
    onEvent({ type: "error", message: event.message });
  };
  worker.onmessageerror = () =>
    onEvent({ type: "error", message: "Worker communication failed" });
  return {
    send: (message) => worker.postMessage(message),
    dispose: () => {
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
    },
  };
}
