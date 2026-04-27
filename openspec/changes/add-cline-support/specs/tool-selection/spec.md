## MODIFIED Requirements

### Requirement: Interactive MCP server addition
The system SHALL provide an interactive wizard to add an MCP server, prompting for tool selection, scope, transport type, command or URL, and environment variables. Tool options SHALL be "Claude Code", "OpenCode", "Cline", and "All".

#### Scenario: Add a stdio server to all tools at user scope
- **WHEN** user runs `mcps add brave-search` and selects "All" tools, "User" scope, "stdio" transport, and enters command `npx -y @brave/brave-search-mcp-server` with env var `BRAVE_API_KEY=xxx`
- **THEN** system writes the server config to Claude Code, OpenCode, and Cline configs in their respective formats

#### Scenario: Add an http server to Cline only at user scope
- **WHEN** user runs `mcps add notion` and selects "Cline" tool, "User" scope, "http" transport, and enters URL `https://mcp.notion.com/mcp`
- **THEN** system writes the server config to `cline_mcp_settings.json` with `type: "streamableHttp"`

#### Scenario: Add a server to Cline at project scope
- **WHEN** user runs `mcps add foo -t cline -s project`
- **THEN** system produces an error stating Cline only supports user scope

#### Scenario: Add a server that already exists
- **WHEN** user attempts to add a server with a name that already exists in the target tool and scope
- **THEN** system prompts to confirm overwrite before proceeding

### Requirement: Non-interactive add with flags
The system SHALL support adding servers non-interactively via command-line flags. The `--tool` flag SHALL accept `claude`, `opencode`, `cline`, or `all`.

#### Scenario: Add stdio server with flags to Cline
- **WHEN** user runs `mcps add myserver --tool cline --scope user --transport stdio --command "npx -y my-server" --env KEY=value`
- **THEN** system adds the server to Cline config without interactive prompts

#### Scenario: Add server with --tool all
- **WHEN** user runs `mcps add notion --tool all --scope user --transport http --url "https://mcp.notion.com/mcp"`
- **THEN** system adds the server to Claude Code, OpenCode, and Cline without interactive prompts

#### Scenario: Reject --tool both
- **WHEN** user runs `mcps add foo --tool both`
- **THEN** system produces an error suggesting "all" instead

## ADDED Requirements

### Requirement: All commands accept cline as a tool
The system SHALL accept `cline` as a valid tool value in all commands (add, remove, list, copy, move).

#### Scenario: Remove from Cline
- **WHEN** user runs `mcps remove myserver --tool cline`
- **THEN** system removes the server from Cline config

#### Scenario: Copy from Cline to Claude Code
- **WHEN** user runs `mcps copy myserver --from cline --to claude`
- **THEN** system reads the server from Cline config and writes it to Claude Code config

#### Scenario: List filtered to Cline
- **WHEN** user runs `mcps list --tool cline`
- **THEN** system displays only servers configured in Cline
