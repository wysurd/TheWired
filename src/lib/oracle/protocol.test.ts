import { expect, test } from "vitest";
import { friendlyOracleError, unavailableReason } from "./protocol";
test("distinguishes insecure pages, unavailable GPU, low memory and supported devices", () => {
  expect(
    unavailableReason({ secure: false, gpu: true, adapter: true }),
  ).toContain("HTTPS");
  expect(
    unavailableReason({ secure: true, gpu: false, adapter: false }),
  ).toContain("WebGPU");
  expect(
    unavailableReason({ secure: true, gpu: true, adapter: false }),
  ).toContain("adapter");
  expect(
    unavailableReason({ secure: true, gpu: true, adapter: true, memoryGB: 2 }),
  ).toContain("less than 4");
  expect(
    unavailableReason({ secure: true, gpu: true, adapter: true, memoryGB: 8 }),
  ).toBeNull();
  expect(
    unavailableReason({ secure: true, gpu: true, adapter: true }),
  ).toBeNull();
});
test("offers concrete fallback for GPU memory loss, context overflow, and download failures", () => {
  expect(friendlyOracleError("device lost")).toContain("memory");
  expect(friendlyOracleError("context window exceeded")).toContain(
    "Clear the conversation",
  );
  expect(friendlyOracleError("fetch failed")).toContain("No question was sent");
});
