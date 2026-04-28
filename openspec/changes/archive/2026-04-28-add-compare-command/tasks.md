## 1. Command Setup

- [x] 1.1 Create `src/commands/compare.ts` with Commander definition, help text, and an optional `[name]` argument for interactive or direct usage
- [x] 1.2 Register `compareCommand` in `src/index.ts`

## 2. Comparison Discovery

- [x] 2.1 Define the supported comparison target list: Claude Code user/project, OpenCode user/project, and Cline user
- [x] 2.2 Read all configured servers with `readServers()` and resolve which of the supported targets contain the requested server name
- [x] 2.3 Build comparison output data that separates configured locations from missing supported locations

## 3. Hint Generation

- [x] 3.1 Implement preferred source selection for hint generation when the server exists in exactly one configured location
- [x] 3.2 Implement stable non-interactive source selection and include `--from-tool` and `--from-scope` in generated hints when multiple configured locations exist
- [x] 3.3 Generate one `mcps copy` hint command for each missing supported location when at least one configured source exists
- [x] 3.4 Handle the no-source case by reporting all locations as missing and omitting copy hints with an explanatory message

## 4. Interactive Flow

- [x] 4.1 Prompt the user to choose a server name when `mcps compare` is run without a positional name in an interactive terminal
- [x] 4.2 Prompt the user to choose the preferred configured source location for hint generation when multiple configured locations exist in interactive mode
- [x] 4.3 Ensure prompt cancellation exits safely without modifying configuration files

## 5. Output and Tests

- [x] 5.1 Render clear CLI output that shows configured locations, missing locations, and copy hints without listing unsupported destinations
- [x] 5.2 Add unit tests for comparison target coverage, missing-everywhere behavior, and hint generation from single and multiple sources
- [x] 5.3 Add CLI integration tests for direct non-interactive compare, interactive name selection, interactive source selection, and cancellation behavior
- [x] 5.4 Run `npm run build && npm test` and fix any failures
