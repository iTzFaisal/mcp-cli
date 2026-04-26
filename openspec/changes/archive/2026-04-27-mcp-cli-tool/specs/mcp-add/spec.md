## ADDED Requirements

### Requirement: Interactive MCP server addition
The system SHALL provide an interactive wizard to add an MCP server, prompting for tool selection, scope, transport type, command or URL, and environment variables.

#### Scenario: Add a stdio server to both tools at user scope
- **WHEN** user runs `mcp add brave-search` and selects "Both" tools, "User" scope, "stdio" transport, and enters command `npx -y @brave/brave-search-mcp-server` with env var `BRAVE_API_KEY=xxx`
- **THEN** system writes the server config to both `~/.claude.json` (mcpServers) and `~/.config/opencode/opencode.json` (mcp) in their respective formats

#### Scenario: Add an http server to Claude Code only at project scope
- **WHEN** user runs `mcp add notion` and selects "Claude Code" tool, "Project" scope, "http" transport, and enters URL `https://mcp.notion.com/mcp`
- **THEN** system writes the server config to `.mcp.json` in the project root

#### Scenario: Add a server with environment variables
- **WHEN** user is prompted for environment variables and enters key-value pairs
- **THEN** system includes those variables in the server config (as `env` for Claude Code, as `environment` for OpenCode)

#### Scenario: Add a server that already exists
- **WHEN** user attempts to add a server with a name that already exists in the target tool and scope
- **THEN** system prompts to confirm overwrite before proceeding

### Requirement: Non-interactive add with flags
The system SHALL support adding servers non-interactively via command-line flags.

#### Scenario: Add stdio server with flags
- **WHEN** user runs `mcp add myserver --tool claude --scope user --transport stdio --command "npx -y my-server" --env KEY=value`
- **THEN** system adds the server without interactive prompts

#### Scenario: Add http server with flags
- **WHEN** user runs `mcp add notion --tool both --scope user --transport http --url "https://mcp.notion.com/mcp"`
- **THEN** system adds the server to both tools without interactive prompts

### Requirement: Transport type determines required fields
The system SHALL prompt for different fields based on the selected transport type.

#### Scenario: stdio transport prompts
- **WHEN** user selects "stdio" transport
- **THEN** system prompts for command and optional environment variables

#### Scenario: http transport prompts
- **WHEN** user selects "http" transport
- **THEN** system prompts for URL and optional headers
