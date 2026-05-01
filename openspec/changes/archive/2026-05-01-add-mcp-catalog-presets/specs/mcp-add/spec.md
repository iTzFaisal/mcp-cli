## MODIFIED Requirements

### Requirement: Interactive MCP server addition
The system SHALL provide an interactive wizard to add an MCP server, prompting for tool selection, scope, transport type, and transport-specific configuration. Interactive tool selection SHALL allow choosing one or more of "Claude Code", "OpenCode", and "Cline" in a single prompt. Before prompting for transport-specific configuration, the system SHALL check a bundled MCP preset catalog for an entry matching the requested server name using case-insensitive exact-name lookup. When a preset is found, the system SHALL tell the user that a configuration was found and offer three choices: use the preset as-is, edit the discovered values first, or continue with full manual entry. If the user chooses the preset as-is, the system SHALL use the preset-derived configuration as the server definition. If the user chooses manual entry, the system SHALL continue with the existing manual prompts.

#### Scenario: Use a discovered preset for an http server
- **WHEN** user runs `mcps add github`, selects one or more target tools and a supported scope, and the bundled catalog contains a matching preset with `type: "http"`, `url`, and optional headers
- **THEN** system informs the user that an MCP configuration was found for `github`
- **THEN** system offers options to use, edit, or manually enter configuration
- **THEN** if the user accepts, system writes the normalized server configuration to each selected tool in its native format without prompting for URL or headers

#### Scenario: Decline a discovered preset and continue manually
- **WHEN** user runs `mcps add github`, selects one or more target tools and a supported scope, and the bundled catalog contains a matching preset
- **THEN** system offers the discovered configuration before manual transport prompts
- **THEN** if the user chooses manual entry, system continues with the normal transport selection and transport-specific prompts

#### Scenario: Edit a discovered preset before adding
- **WHEN** user runs `mcps add consensus`, selects one or more target tools and a supported scope, and the bundled catalog contains a matching preset with placeholder values
- **THEN** system offers the discovered configuration before manual transport prompts
- **THEN** if the user chooses to edit, system pre-fills the transport-specific prompts with the preset values
- **THEN** system writes the edited normalized server configuration to each selected tool in its native format

#### Scenario: No preset match exists
- **WHEN** user runs `mcps add custom-server` and the bundled catalog does not contain a matching preset
- **THEN** system skips the preset action step
- **THEN** system continues with the normal interactive add wizard

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

### Requirement: Non-interactive add with flags
The system SHALL support adding servers non-interactively via command-line flags. The `--tool` flag SHALL accept `claude`, `opencode`, `cline`, or `all`. The system SHALL accept environment variables only for `stdio` servers and remote headers only for `http` servers. When the user provides a complete non-interactive add command, the system SHALL use the explicit flag values and SHALL NOT replace them with catalog preset values.

#### Scenario: Add stdio server with flags to Cline
- **WHEN** user runs `mcps add myserver --tool cline --scope user --transport stdio --command "npx -y my-server" --env KEY=value`
- **THEN** system adds the server to Cline config without interactive prompts

#### Scenario: Add http server with multiple headers to all tools
- **WHEN** user runs `mcps add notion --tool all --scope user --transport http --url "https://mcp.notion.com/mcp" --header "Authorization=Bearer API_KEY" --header "OTHER=val"`
- **THEN** system adds the server to Claude Code, OpenCode, and Cline without interactive prompts and writes `headers.Authorization: "Bearer API_KEY"` and `headers.OTHER: "val"` in each target tool's native format

#### Scenario: Reject --tool both
- **WHEN** user runs `mcps add foo --tool both`
- **THEN** system produces an error suggesting "all" instead

#### Scenario: Explicit flags take precedence over presets
- **WHEN** user runs `mcps add github --tool claude --scope user --transport http --url "https://example.com/custom"`
- **THEN** system adds the server using the explicit flag values
- **THEN** system does not prompt to use a discovered preset

#### Scenario: Case-insensitive preset lookup
- **WHEN** user runs `mcps add GitHub` and the bundled catalog contains a `github` preset
- **THEN** system finds the preset match without requiring exact casing

### Requirement: Transport type determines required fields
The system SHALL prompt for different fields based on the selected transport type.

#### Scenario: stdio transport prompts
- **WHEN** user selects "stdio" transport during manual interactive entry
- **THEN** system prompts for command and optional environment variables

#### Scenario: http transport prompts
- **WHEN** user selects "http" transport during manual interactive entry
- **THEN** system prompts for URL and optional headers using the same comma-separated `KEY=VALUE` style as `env` with placeholder `Authorization=Bearer API_KEY,OTHER=val`
