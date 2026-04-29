## MODIFIED Requirements

### Requirement: Interactive MCP server addition
The system SHALL provide an interactive wizard to add an MCP server, prompting for tool selection, scope, transport type, and transport-specific configuration. Interactive tool selection SHALL allow choosing one or more of "Claude Code", "OpenCode", and "Cline" in a single prompt.

#### Scenario: Add a stdio server to multiple selected tools at user scope
- **WHEN** user runs `mcps add brave-search`, selects "Claude Code" and "OpenCode", selects "User" scope, selects "stdio" transport, and enters command `npx -y @brave/brave-search-mcp-server` with env var `BRAVE_API_KEY=xxx`
- **THEN** system writes the server config to Claude Code and OpenCode configs in their respective formats

#### Scenario: Add an http server to Cline only at user scope with headers
- **WHEN** user runs `mcps add notion`, selects "Cline", selects "User" scope, selects "http" transport, enters URL `https://mcp.notion.com/mcp`, and enters headers `Authorization=Bearer API_KEY,OTHER=val`
- **THEN** system writes the server config to `cline_mcp_settings.json` with `type: "streamableHttp"`, `headers.Authorization: "Bearer API_KEY"`, and `headers.OTHER: "val"`

#### Scenario: Add a server to a mixed selection that includes Cline at project scope
- **WHEN** user runs `mcps add foo`, selects "Claude Code" and "Cline", and selects "Project" scope
- **THEN** system adds the server to Claude Code project config
- **THEN** system warns that Cline only supports user scope and skips the Cline write

#### Scenario: Add a server that already exists in one selected target
- **WHEN** user attempts to add a server interactively to multiple selected tools and the server name already exists in one target tool and scope
- **THEN** system prompts to confirm overwrite for that existing target before proceeding
