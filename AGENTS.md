# Development conventions

- Stack: React 19, TypeScript (strict), Vite, Tailwind CSS 4. Node 22+.
- Use this existing checkout. Cloud tasks are isolated; do not create worktrees unless explicitly requested.
- Install with `npm ci`; use a writable npm cache when needed (`--cache /workspace/.npm-cache`).
- `npm run dev` serves the app; `npm run build` produces `dist/`; `npm run preview` serves the production build.
- Required checks: `npm run check`, `npm test`, `npm run build`, `npm run test:e2e`. Browser checks use Playwright Chromium; run `npx playwright install chromium` if needed. Set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH only to use an existing compatible Chromium.
- Keep curriculum in src/data, persistence and research adapters in src/lib, and shared visuals in src/components. Use typed data and functional state updates.
- Never render remote HTML. Never embed credentials. This is a static, local-first app; progress is browser-local and research requests go directly to a public API.
- Keep storage versioned and resilient to corrupted data or disabled storage. Preserve existing learning data when adding features.
- Use semantic elements, labeled controls, keyboard focus states, responsive layouts, and reduced-motion support. No copied franchise artwork or branding.
- Hash navigation avoids GitHub Pages deep-link failures. Keep the `/TheWired/` production base in sync if the repository is renamed.
- Verify the real build, quizzes, persistence, network controls, and mobile navigation after changes. Mock external APIs in deterministic tests, keeping live-failure states visible.
- Work on feature branches. Do not merge into main or publish deployments without user approval.

## v0.2 learning and Oracle conventions

- Preserve v0.1 module IDs and `wired-progress-v1`. Reading positions use separate `wired-reading-v2:<module>` keys.
- Chapters live in `src/data/chapters` with eight stable section IDs. Add worked calculations, honest limitations, and primary references; do not replace content with generated chat.
- Keep `LessonReader` and `Oracle` lazy, and WebLLM only in the dedicated worker. Do not introduce an eager AI import or a remote inference fallback.
- Model activation must remain explicit. Show download/resource estimates, context sources, AI output labels, and recoverable failure states. Questions stay inside the browser worker.
- Bound context and conversation size; scope selected text to the active lesson; clear selection on section changes and dispose workers on chapter exit. Do not persist conversations or claim a small model’s math is verified.
- Use `npm run format` and `npm run format:check` (Prettier). Also run `npm run build:pages` then `npm run test:pages` for deployment-path validation.
- Oracle worker doubles are test-only. Distinguish mocked UI/protocol tests from actual model download/inference checks in reports. See docs/ORACLE.md and docs/DEPENDENCIES.md.
