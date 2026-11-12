import type { PromptMessage } from "./context";
export const MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f32_1-MLC";
export type OracleRequest =
  | { type: "load" }
  | { type: "generate"; messages: PromptMessage[] }
  | { type: "stop" };
export type OracleEvent =
  | { type: "progress"; progress: number; text: string }
  | { type: "ready" }
  | { type: "token"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };
export type OracleState =
  | "idle"
  | "checking"
  | "loading"
  | "ready"
  | "generating"
  | "unsupported"
  | "error";
export function friendlyOracleError(message: string): string {
  if (/memory|allocation|device.*lost|out of|buffer.*size/i.test(message))
    return "The GPU could not allocate enough memory or the device was lost. Close other GPU-heavy tabs, unload, and try again. Reading and worked solutions remain available.";
  if (/context|token.*limit|exceed.*length/i.test(message))
    return "This request exceeded the local model’s context limit. Clear the conversation or ask a shorter question.";
  return "The local model could not load or complete the request. Check your connection, free storage, and WebGPU support, then retry. No question was sent to an inference service.";
}
export interface DeviceSupport {
  secure: boolean;
  gpu: boolean;
  adapter: boolean;
  memoryGB?: number;
}
export function unavailableReason(device: DeviceSupport): string | null {
  if (!device.secure)
    return "The Oracle needs a secure page (HTTPS or localhost). The chapters and worked solutions still work.";
  if (!device.gpu || !device.adapter)
    return "No usable WebGPU adapter was found. Try an up-to-date Chrome or Edge with hardware acceleration on a supported device. You can still study every chapter and worked solution.";
  if (device.memoryGB !== undefined && device.memoryGB < 4)
    return "This device reports less than 4 GB of system memory. Local inference is disabled to avoid exhausting it. Use the authored chapters and worked solutions, or try a higher-memory device.";
  return null;
}
