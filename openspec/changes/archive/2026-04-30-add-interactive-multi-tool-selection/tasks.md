## 1. Interactive Prompt Update

- [x] 1.1 Replace the interactive tool prompt in `src/commands/add.ts` with a multi-select flow that returns one or more selected tools.
- [x] 1.2 Remove interactive-only `All` handling and normalize selected tools into the existing per-target write loop while preserving non-interactive `--tool all` behavior.
- [x] 1.3 Keep current project-scope Cline skip handling and per-target overwrite confirmation working when multiple tools are selected.

## 2. Test Coverage

- [x] 2.1 Update `src/commands/add.test.ts` mocks for the interactive prompt API used by the new multi-select flow.
- [x] 2.2 Add a test that selecting multiple tools writes the same server configuration to each selected destination.
- [x] 2.3 Add a test that a mixed selection including Cline at project scope writes supported targets and logs the Cline skip warning.

## 3. Verification

- [x] 3.1 Build the project with `npm run build`.
- [x] 3.2 Run the test suite with `npm test` after the build completes.
