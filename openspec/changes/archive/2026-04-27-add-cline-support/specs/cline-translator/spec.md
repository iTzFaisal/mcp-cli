## ADDED Requirements

### Requirement: Translate universal model to Cline format
The system SHALL convert a universal MCP server object to Cline's native JSON schema.

#### Scenario: Translate stdio server to Cline
- **WHEN** universal server has `transport: "stdio"`, `command: ["npx", "-y", "server"]`, `env: {"KEY": "val"}`
- **THEN** output is `{ "command": "npx", "args": ["-y", "server"], "env": {"KEY": "val"}, "disabled": false }`

#### Scenario: Translate http server to Cline
- **WHEN** universal server has `transport: "http"`, `url: "https://example.com/mcp"`
- **THEN** output is `{ "url": "https://example.com/mcp", "type": "streamableHttp", "disabled": false, "timeout": 60 }`

#### Scenario: Translate disabled server to Cline
- **WHEN** universal server has `disabled: true`
- **THEN** output includes `"disabled": true`

### Requirement: Translate Cline format to universal model
The system SHALL parse Cline's native server format into the universal model.

#### Scenario: Parse Cline stdio server
- **WHEN** reading `{ "command": "node", "args": ["server.js"], "env": {"KEY": "val"}, "disabled": false }`
- **THEN** universal model has `transport: "stdio"`, `command: ["node", "server.js"]`, `env: {"KEY": "val"}`, `disabled: false`

#### Scenario: Parse Cline remote server with streamableHttp
- **WHEN** reading `{ "url": "https://example.com/mcp", "type": "streamableHttp", "disabled": false }`
- **THEN** universal model has `transport: "http"`, `url: "https://example.com/mcp"`, `disabled: false`

#### Scenario: Parse Cline remote server with sse
- **WHEN** reading `{ "url": "https://example.com/mcp", "type": "sse", "disabled": true }`
- **THEN** universal model has `transport: "http"`, `url: "https://example.com/mcp"`, `disabled: true`

#### Scenario: Parse Cline server with autoApprove
- **WHEN** reading `{ "command": "node", "args": [], "autoApprove": ["tool1"] }`
- **THEN** universal model omits `autoApprove` (not in universal model)

#### Scenario: Parse Cline server with timeout
- **WHEN** reading `{ "url": "https://example.com/mcp", "type": "streamableHttp", "timeout": 120 }`
- **THEN** universal model omits `timeout` (not in universal model)

### Requirement: Top-level key is mcpServers
The Cline translator SHALL read from and write to the `mcpServers` key in the JSON file.

#### Scenario: Read servers from mcpServers key
- **WHEN** reading `cline_mcp_settings.json` with `{ "mcpServers": { "my-server": {...} } }`
- **THEN** system extracts servers from the `mcpServers` key

#### Scenario: Write servers to mcpServers key
- **WHEN** writing a server to Cline config
- **THEN** system places it under the `mcpServers` key and preserves unrelated top-level fields
