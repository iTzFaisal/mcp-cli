## MODIFIED Requirements

### Requirement: Copy to "all" tools
The system SHALL support copying a server to Claude Code, OpenCode, Cline, VS Code, and Hermes simultaneously.

#### Scenario: Copy to all tools interactively
- **WHEN** user selects "All" as the target tool in interactive mode
- **THEN** system writes the server to all tools at the selected scope

#### Scenario: Copy to all tools non-interactively
- **WHEN** user runs `mcps copy brave-search --tool all --scope user`
- **THEN** system writes to Claude Code, OpenCode, Cline, VS Code, and Hermes user-scope configs without prompts

#### Scenario: Copy from Cline to Claude Code
- **WHEN** user runs `mcps copy myserver --from cline --to claude`
- **THEN** system reads the server from Cline config and writes it to Claude Code config

### Requirement: Copy Hermes servers through the universal model
The system SHALL allow Hermes to participate as a source and destination in copy flows using the universal MCP server model.

#### Scenario: Copy from Hermes user to OpenCode user
- **WHEN** user runs `mcps copy brave-search --from-tool hermes --from-scope user --tool opencode --scope user`
- **THEN** system reads the server from `~/.hermes/config.yaml` and writes it to `~/.config/opencode/opencode.json`

#### Scenario: Copy from Claude Code user to Hermes user
- **WHEN** user runs `mcps copy brave-search --from-tool claude --from-scope user --tool hermes --scope user`
- **THEN** system reads the server from `~/.claude.json` and writes it to `~/.hermes/config.yaml`

#### Scenario: Drop Hermes-only metadata on cross-tool copy
- **WHEN** user copies a Hermes server containing Hermes-only fields outside the universal model
- **THEN** system copies only shared universal fields such as transport, command, env, url, headers, and disabled state
