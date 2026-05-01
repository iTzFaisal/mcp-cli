## 1. Catalog Asset and Loading

- [x] 1.1 Decide the packaged catalog asset location and update build or publish configuration so the bundled snapshot is available in installed npm packages.
- [x] 1.2 Add a small catalog loading path that reads the bundled snapshot and safely falls back when the asset is missing or invalid.
- [x] 1.3 Normalize catalog entries into the existing `McpServer` model using the current Claude translator path for the first iteration.

## 2. Add Command Preset Flow

- [x] 2.1 Update `src/commands/add.ts` to look up a preset by server name during the interactive add flow before manual transport prompts.
- [x] 2.2 Add a confirmation prompt that tells the user a configuration was found and asks whether to use the discovered parameters instead of entering them manually.
- [x] 2.3 If the user accepts, skip manual transport-specific prompts and continue through the existing per-target overwrite and write flow with the preset-derived `McpServer`.
- [x] 2.4 If the user declines or no preset exists, preserve the current manual interactive wizard behavior unchanged.
- [x] 2.5 Keep fully explicit non-interactive flag usage authoritative so preset lookup does not override provided transport values.

## 3. Test Coverage

- [x] 3.1 Add command tests for preset discovery and acceptance for at least one remote server entry.
- [x] 3.2 Add command tests for declining a discovered preset and falling back to manual prompts.
- [x] 3.3 Add command tests for the no-match path and for explicit non-interactive flags bypassing preset prompts.
- [x] 3.4 Add coverage that proves preset-derived configurations still translate correctly for Claude Code, OpenCode, and Cline writes.

## 4. Verification

- [x] 4.1 Build the project with `npm run build`.
- [x] 4.2 Run the test suite with `npm test` after the build completes.
