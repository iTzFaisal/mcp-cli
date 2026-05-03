## 1. Core Model And Translation

- [x] 1.1 Add `vscode` to the supported tool model and any shared tool-label/display helpers.
- [x] 1.2 Implement VS Code path helpers for default local user config and workspace `.vscode/mcp.json`.
- [x] 1.3 Implement the VS Code translator for stdio and http/sse server entries using the existing universal model.
- [x] 1.4 Add unit tests for VS Code paths and translator behavior, including `${input:...}` pass-through and omitted disabled state.

## 2. Config IO Integration

- [x] 2.1 Extend config path resolution to return VS Code user and project config paths.
- [x] 2.2 Extend config readers to parse servers from VS Code `servers` keys for user and project scope.
- [x] 2.3 Extend config writers and removers to write under `servers`, preserve unrelated fields, and create `.vscode/mcp.json` when missing.
- [x] 2.4 Add reader/writer tests covering VS Code read, write, remove, and missing-file behavior.

## 3. Command Support

- [x] 3.1 Extend `add` command validation, interactive tool selection, help text, and `all` handling to include VS Code.
- [x] 3.2 Extend `list`, `copy`, `move`, `compare`, and `remove` command logic to include VS Code wherever supported.
- [x] 3.3 Update command-specific edge cases and destination enumeration so VS Code user/project are included while Cline project remains unsupported.
- [x] 3.4 Add command and CLI integration tests covering VS Code user/project scenarios and `all` tool behavior.

## 4. Documentation And Verification

- [x] 4.1 Update user-facing help or README content that enumerates supported tools and config paths.
- [x] 4.2 Build the project and run the test suite, fixing any failures introduced by VS Code support.
