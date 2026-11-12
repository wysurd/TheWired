# The Wired · v0.1

A personal AI research and learning workstation. Original terminal-inspired visuals, near-black surfaces, muted green typography, subtle CRT texture, and animated network diagrams. Built with React, TypeScript, Vite, and Tailwind CSS.

## Develop and preview

Requires Node.js 22+ and npm.

```sh
npm ci
npm run dev
```

Vite prints the local address (normally port 5173). For a production preview, run `npm run build` followed by `npm run preview` (port 4173). Use your development environment's port forwarding when accessing remotely.

## Features

- **Dashboard:** actual module completion, quiz mastery, paper counts, next module, and navigation.
- **Knowledge Archive:** searchable modules for neural networks, CNNs, RNNs, LSTMs, GNNs, Transformers, decision trees, and random forests. Every module has a mental model, practical example, limitation, and checkpoint.
- **Simulation Lab:** adjustable hidden layers (1–5) and neurons per hidden layer (2–10), fully connected SVG topology, live neuron/connection/parameter counts, pause and reset. Animation illustrates flow; it does not train a model.
- **Research Signal:** four curated foundational papers and manual or opt-in five-minute refresh from Europe PMC's public REST API. Live results focus on deep learning, including biomedical applications. No credentials or paid services. Timeouts and service failures retain the current papers and show a status message. Automatic refresh runs only while the app is open and opted in.
- **Memory Bank:** module completion, latest quiz scores, and paper bookmarks in versioned localStorage. Results survive reloads on the same browser/origin. Storage failures are surfaced. Reset requires confirmation.

No accounts, server, analytics, or cloud sync. Private browsing, clearing site data, or changing origin can remove or separate progress. Research content is not persisted across reloads; saved paper IDs still link to their source.

## Checks

```sh
npm run check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

To use an installed browser, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`. Browser tests cover learning, quizzes, reload persistence, paper bookmarks, topology controls, live-feed responses and errors, mobile navigation, and search. External API responses are mocked for deterministic tests. Live source connectivity is a separate check.

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` validates pull requests and deploys only `main` after checks pass. In repository **Settings → Pages → Build and deployment**, select **GitHub Actions**. After review and an approved merge, the workflow publishes the static `dist/` artifact. Expected URL: `https://wysurd.github.io/TheWired/` (not deployed by this task).

CI builds use the `/TheWired/` base; hash navigation keeps all sections reachable without server rewrites. If the repository is renamed, update `vite.config.ts`. Pages is free for public repositories under GitHub's free-plan limits; private repository availability depends on your plan. No paid backend is required.

## Structure

- `src/data/modules.ts`: typed curriculum and checkpoints
- `src/lib/storage.ts`: resilient, versioned local persistence
- `src/lib/research.ts`: curated source data and public API adapter
- `src/components/`: shared interface and visual components
- `src/App.tsx`: navigation and feature orchestration
- `src/styles.css`: responsive terminal design and reduced-motion support

## Current limitations

No real neural network training, spaced-repetition scheduler, server-side article ingestion, or cross-device sync. Live API availability and CORS depend on the public provider. This cloud environment initially denied `www.ebi.ac.uk`; a domain addition is saved in environment settings and must be applied before live access can be verified here.
