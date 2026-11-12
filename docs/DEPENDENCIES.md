# Dependency audit / v0.2

Audit performed with npm against the lockfile on November 12, 2026. No `npm audit fix --force` or automatic major-version sweep was used.

## Findings and remediation

The v0.1 lockfile reported three vulnerable packages: `@vitest/mocker` (moderate), `tinypool` (critical), and the direct `vitest` dependency (critical through the affected chain). These were development/test tooling dependencies, not code served in the production bundle. This distinction does not make the findings safe to ignore.

- [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9): mock redirect path traversal / file read.
- [GHSA-qxg6-89mg-rqv8](https://github.com/advisories/GHSA-qxg6-89mg-rqv8): unauthenticated manual mock registration/code injection.
- [GHSA-5gmw-xhrv-c9v3](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3) and [GHSA-85c8-ppgw-ccpr](https://github.com/advisories/GHSA-85c8-ppgw-ccpr): Tinypool prototype-pollution/RCE gadgets.

Vitest 3.2.7 was replaced with the explicitly pinned 4.1.12 release. Its Node engine supports the repository’s Node 22+ baseline, and its declared Vite compatibility includes the existing Vite 6. The patched mocker is included, and Tinypool is removed from this dependency graph. The existing tests ran successfully after the migration; no test assertion or runtime verification was disabled to make the upgrade pass. Vite, React, and TypeScript were not given unrelated breaking upgrades.

WebLLM is pinned to 0.2.88, and its compatible prebuilt model-library mapping is supplied by that release. It is bundled into a separate worker rather than imported by the initial application entry. Prettier 3.6.2 is development-only and supports consistent reviewable source formatting.

After the changes, `npm audit` reports **zero vulnerabilities**, including `npm audit --omit=dev`. Audit results are point-in-time registry findings, not proof that all dependencies or model artifacts are defect-free. Re-run the audit when updating the lockfile. Model weights and the compatible WASM file are downloaded over verified HTTPS from upstream hosts on explicit activation; they are not npm packages and are outside npm audit’s coverage.

## Repeatable checks

```sh
npm ci
npm audit
npm audit --omit=dev
npm run check
npm run format:check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run build:pages
npm run test:pages
```

`test:pages` uses the already-built `/TheWired/` artifact, starts a temporary preview on port 4174, exercises chapter deep links and lazy interface assets, checks that the Oracle worker is not eagerly fetched, and verifies the emitted worker URL. It does not download the model. Use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` for either browser test command when using a compatible system Chromium.
