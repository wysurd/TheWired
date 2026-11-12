# The Oracle / local inference guide

The Oracle is an experimental AI study assistant inside the Knowledge Archive. It uses WebLLM 0.2.88 and the open-weight, Apache-2.0 Qwen2.5-0.5B-Instruct model in MLC’s `q4f32_1` format. The model is deliberately small enough to attempt on consumer devices; it is not a reliable mathematical authority.

## Activation and privacy

1. Open a chapter and choose **Open The Oracle**. This loads the interface, not the model.
2. Read the resource estimate and choose **Activate local model**.
3. The app checks secure context, WebGPU adapter availability, and reported system memory before creating the worker.
4. The worker downloads model configuration, tokenizer, weights, and a compatible WebAssembly library. It initializes a local WebGPU engine and shows progress.
5. Only after initialization can you submit a question. Generation runs in the worker on your device.

There is no paid API, external inference endpoint, server runtime, API key, account, telemetry, or automatic provider fallback. WebLLM’s OpenAI-shaped JavaScript API is a local interface; it does not call OpenAI. Model file hosts receive ordinary download requests and network metadata, but never lesson questions, selections, or conversation text from this application. Research Signal remains a separate, explicitly refreshed public research feed.

The only model sources configured by the pinned WebLLM preset are Hugging Face’s MLC model repository and the compatible compiled library on `raw.githubusercontent.com`. Hugging Face can redirect weight downloads to its CDN or Xet storage hosts. A restricted network must allow those download destinations. The GitHub Pages host serves the app and bundled worker, not the model weights.

## Device requirements and size

| Item                  | Current choice / estimate                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| Model                 | `Qwen2.5-0.5B-Instruct-q4f32_1-MLC`                                                                          |
| Parameters            | Approximately 0.5 billion                                                                                    |
| Weight quantization   | 4-bit, with FP32 runtime variant to avoid requiring shader-f16                                               |
| Model download budget | Roughly 350–500 MB including weights and tokenizer; an estimate, not a measured download in this environment |
| Local runtime asset   | Approximately 6.1 MB uncompressed, fetched only after activation                                             |
| GPU memory            | WebLLM preset estimates 1,060.2 MB; allow additional browser/driver headroom                                 |
| System memory         | At least 4 GB recommended; 8 GB is safer. Devices reporting less than 4 GB are blocked before loading        |
| Context window        | 4,096 tokens                                                                                                 |
| Maximum response      | 384 generated tokens per request                                                                             |
| First initialization  | May take several minutes depending on connection, GPU, and compilation                                       |

Use an up-to-date browser with working WebGPU, a supported GPU/driver, hardware acceleration, workers, WebAssembly, and the browser Cache API. Current Chrome or Edge on a capable desktop is the preferred starting point. WebGPU support varies across operating systems and mobile browsers; a browser version alone does not guarantee a usable adapter. HTTPS is required except for localhost development. GitHub Pages supplies HTTPS.

There is no portable, dependable browser API for free GPU memory. `deviceMemory`, where present, is a coarse system-memory hint, not a GPU allocation guarantee. Adapter checks can pass and model initialization can still fail. Close graphics-heavy tabs and applications before retrying. Low-memory phones are expected to use the authored reading fallback. No CPU inference fallback is included in v0.2.

## Lesson and selection context

The context card names the active chapter and section. Each request includes:

- Up to 3,000 characters from the current section, including its equations or code when within that budget.
- Up to 700 characters of highlighted text whose endpoints both lie inside the active lesson content.
- Up to four recent conversation messages, clipped to 500 characters each.
- A question of at most 800 characters and a tutor instruction asking for careful, stepwise explanations.

Highlight text using the mouse or keyboard; it appears in the context card. Click **Clear selection** to remove it. Switching sections clears the selection and updates the next request’s context. The conversation remains available for follow-ups within the chapter, and each answer is labeled with the section used when it was requested. A generation already in progress continues using its original context. Leaving the chapter terminates the worker and clears this transient conversation.

Text budgets keep ordinary requests small but are not exact token counts; unusual Unicode or code-heavy input can still reach the model limit. A context-limit error asks you to clear the conversation or shorten the question. The app includes the current section, not the full archive or the entire book. It does not perform retrieval or fine-tuning.

Authored sections are labeled **LESSON MATERIAL**. Responses are labeled **ORACLE / AI-GENERATED**. Remote/model text is rendered as plain React text with preserved whitespace, never injected HTML. The tutor asks for plain-text equations; v0.2 does not render LaTeX. Code examples are reference material for your own Python environment and are not executed by the website.

## Controls and failure behavior

- **Cancel loading** terminates the worker, preventing a late initialization result from restoring the session.
- **Stop** asks the local engine to interrupt generation; if the GPU stalls, a two-minute watchdog terminates the worker.
- **Unload model** terminates the worker and releases its runtime resources. Driver reclamation may not be immediate.
- **Collapse Oracle** hides the panel while preserving its active runtime and conversation. It does not unload the model.
- **Clear chat** removes the visible follow-up history. Conversations are never persisted by the app.
- Leaving the chapter releases the worker. Model activation is required again when reentering.

Initialization has a ten-minute watchdog and can always be canceled. Unsupported WebGPU, insecure pages, reported low memory, GPU allocation loss, failed downloads, storage problems, and initialization/generation failures all leave the authored chapter usable. The interface shows a reason and provides a link to its worked example. This fallback does not generate or impersonate an AI answer.

## Caching and storage

WebLLM’s browser Cache API backend retains downloaded model artifacts under the current site origin. It can reuse cached files on later activations, reducing repeat downloads. Cache persistence depends on browser quota, eviction, private browsing, and the model/version. Metadata or runtime updates may still require a connection. This is not a guaranteed offline app, and there is no service worker to cache the website itself.

Model caches differ from `localStorage`, which holds learning progress. Unloading does not delete downloaded weights. Use browser site-data settings to clear the origin’s cached model data; clearing all site data also deletes local progress and reading positions. Local development and GitHub Pages use different origins and therefore different caches/progress.

## Limits and validation status

A 0.5B model can produce incorrect equations, arithmetic, explanations, or citations. It has no browsing, tools, Python execution, current research access, or proof checker. A request for a walkthrough is supported as a conversation task, but its correctness is not guaranteed. Check against chapter references and independently calculate results.

Verified here: real Chromium activation correctly reports that no usable WebGPU adapter is available; all authored content remains accessible. The model host also returned an outbound-policy 403 in this cloud environment. Real weight download, cache reuse across activations, GPU memory use, speed, and successful model generation were **not verified**. UI/protocol tests use an explicitly test-only worker double; they are not evidence of model quality or inference success. A manual test on a capable, unrestricted WebGPU device remains necessary before claiming end-to-end tutor readiness.

For that manual test, use `npm run dev` on localhost or a deployed HTTPS Pages site. Activate the model, observe progress, ask for the neural-network worked-example gradient calculation, ask a follow-up, highlight a passage, stop a longer response, unload and reactivate to observe caching, then compare every numerical answer to the authored solution.

## Upstream references

- [WebLLM source and documentation](https://github.com/mlc-ai/web-llm)
- [Qwen2.5-0.5B-Instruct model card and license](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct)
- [MLC quantized model files](https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q4f32_1-MLC)
