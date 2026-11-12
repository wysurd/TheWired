# The Wired · v0.2

A personal AI research and learning workstation. Original near-black surfaces, muted green terminal typography, subtle CRT texture, and interactive network diagrams. Built with React, TypeScript, Vite, and Tailwind CSS; deployable as static files on GitHub Pages.

## Develop and preview

Requires Node.js 22+ and npm. Work from `feat/the-wired-v0.2`, which was created from the completed `feat/the-wired-v0.1` commit `48fa663`, not the README-only main branch.

```sh
npm ci
npm run dev
```

Vite prints the local address, normally port 5173. Forward that port for a remote development environment. For a production preview, use `npm run build` then `npm run preview` (port 4173). No API keys, accounts, paid services, or backend are required.

## What works

- **Dashboard:** real module completion, quiz mastery, paper counts, next learning module, and quick navigation.
- **Knowledge Archive:** eight original chapters covering neural networks, CNNs, RNNs, LSTMs, GNNs, Transformers, decision trees, and random forests. Each has learning objectives, prerequisites, foundations, architecture, mathematics, numerical worked examples, implementation code, advanced concepts, limitations, assessment, and references. Navigate eight sections, reveal worked solutions, follow section URLs, and resume your last section.
- **The Oracle:** collapsible tutor beside the desktop reader, with local WebLLM inference integration and explicit activation. Current-section and highlighted-text context, follow-up conversation, initialization progress, streamed response handling, stop, cancel, unload, and honest reading-only fallbacks. The 0.5B model requires a capable WebGPU device and roughly 350–500 MB of initial model downloads. Real generation was not verified in this cloud environment; see [the complete model guide](docs/ORACLE.md).
- **Simulation Lab:** adjustable dense topology (1–5 hidden layers, 2–10 neurons per hidden layer), accurate neuron/edge/parameter counts, animation pause and reset. This visualizes architecture, not training or inference.
- **Research Signal:** curated foundational papers, bookmarks, manual refresh, and opt-in five-minute refresh from Europe PMC’s public API. Timeouts and failures retain existing papers and display a status message.
- **Memory Bank:** existing module completion, latest checkpoint scores, and paper IDs remain in `wired-progress-v1`. v0.2 reading positions use separate keys. Everything stays in this browser; no account or cloud sync.

All eight v0.1 module IDs are preserved. Existing completion/quiz/bookmark data is not migrated or overwritten with an empty schema. Oracle conversations are transient and do not enter localStorage. Browser storage failures are surfaced. Clearing site data deletes progress; changing origin separates it. Saved research IDs retain source links even when feed contents are no longer loaded.

## The Oracle / resource and privacy contract

Opening the panel loads only its interface. **Activate local model** starts a worker and downloads open model artifacts from Hugging Face and WebLLM’s compiled library from GitHub. Lesson questions and selections are passed only to the local worker. There is no external inference provider or silent API fallback.

Use HTTPS or localhost and an up-to-date browser with a usable WebGPU adapter. Budget at least 1.1 GB of available GPU memory plus driver headroom, 4 GB+ system RAM (8 GB safer), and several hundred MB of browser cache. Low-memory or unsupported devices retain all authored content and worked solutions. Small-model mathematical answers can be wrong; responses are clearly labeled AI-generated. Downloads, cache behavior, limits, and validation status are detailed in [docs/ORACLE.md](docs/ORACLE.md).

## Checks

```sh
npm run check
npm run format:check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run build:pages
npm run test:pages
npm audit
```

To use installed Chromium, prefix browser checks with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`. Oracle UI tests use an explicit worker double for deterministic local-runtime events, not actual model inference. A separate real-browser check verified the unsupported-adapter fallback. Read [the dependency audit](docs/DEPENDENCIES.md) for the vulnerability investigation and targeted Vitest upgrade.

## GitHub Pages

In repository **Settings → Pages → Build and deployment**, select **GitHub Actions**. The workflow validates pull requests and deploys only approved changes on `main`. Nothing in v0.2 merges or deploys itself.

`npm run build:pages` explicitly emits `/TheWired/` asset URLs. `npm run test:pages` serves that artifact with the matching base and verifies deep links, lazy chapter/Oracle chunks, and the worker asset URL. To preview manually, run:

```sh
npm run build:pages
npm run preview -- --base /TheWired/
```

Open the printed address with `/TheWired/` appended. Hash routes such as `#archive/transformer/mathematics` require no server rewrites. Expected deployed URL after an approved merge and successful workflow: `https://wysurd.github.io/TheWired/`. Update the base in package scripts, Vite configuration, and Pages smoke check if renaming the repository. Pages is free for public repositories within GitHub’s limits; private-repository access depends on the GitHub plan.

## Architecture

- `src/data/modules.ts`: stable v0.1 module identities and checkpoint metadata.
- `src/data/chapters/`: typed, structured chapter content; loaded with the reader rather than the dashboard.
- `src/components/LessonReader.tsx`: section navigation, reading position, scoped selection, and Oracle dock.
- `src/components/Oracle.tsx`: explicit activation, lifecycle, status, conversation, and fallbacks.
- `src/lib/oracle/`: bounded context builder, typed protocol, worker client, local WebLLM worker.
- `src/lib/storage.ts`: compatible v0.1 persistence; `lessonNavigation.ts`: v0.2 routes and reading positions.
- `src/components/Network.tsx`: shared interactive topology visualization.
- `src/lib/research.ts`: public research adapter and curated papers.
- `src/App.tsx`: feature orchestration; `src/styles.css`: responsive CRT-inspired visual system.
- `tests/`: deterministic browser regression tests; `scripts/check-pages.mjs`: production-path smoke check.

## Remaining limitations

Successful real model download, GPU generation, cache reuse, and inference speed have not been verified here: headless Chromium has no usable WebGPU adapter, and the cloud network denied Hugging Face. The complete integration is present, but end-to-end tutor validation requires a capable device with access to model hosts. No fake answers replace it.

Python examples are educational reference snippets, not executed browser notebooks. The archive is a structured learning foundation, not an exhaustive textbook. No spaced-repetition scheduler, real training engine, live code execution, cross-device sync, or LaTeX renderer is included. Europe PMC live access is also subject to network policy; deterministic feed tests use mocked responses.
