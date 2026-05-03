## Purpose

Define how VS Code MCP server entries are translated to and from the universal MCP server model.

## Requirements

### Requirement: Translate universal model to VS Code format
The system SHALL convert a universal MCP server object to VS Code's native `servers` entry schema.

#### Scenario: Translate stdio server to VS Code
- **WHEN** universal server has `transport: "stdio"`, `command: ["npx", "-y", "server"]`, and `env: {"KEY": "val"}`
- **THEN** output is `{ "command": "npx", "args": ["-y", "server"], "env": {"KEY": "val"} }`

#### Scenario: Translate http server to VS Code
- **WHEN** universal server has `transport: "http"`, `url: "https://example.com/mcp"`, and `headers: {"Authorization": "Bearer API_KEY"}`
- **THEN** output is `{ "type": "http", "url": "https://example.com/mcp", "headers": {"Authorization": "Bearer API_KEY"} }`

#### Scenario: Omit disabled field when writing VS Code
- **WHEN** universal server has `disabled: true`
- **THEN** VS Code output omits any enabled or disabled field

### Requirement: Translate VS Code format to universal model
The system SHALL parse VS Code server entries into the universal model.

#### Scenario: Parse VS Code stdio server
- **WHEN** reading `{ "command": "npx", "args": ["-y", "server"], "env": {"KEY": "val"} }`
- **THEN** universal model has `transport: "stdio"`, `command: ["npx", "-y", "server"]`, `env: {"KEY": "val"}`, and `disabled: undefined`

#### Scenario: Parse VS Code http server
- **WHEN** reading `{ "type": "http", "url": "https://example.com/mcp", "headers": {"Authorization": "Bearer API_KEY"} }`
- **THEN** universal model has `transport: "http"`, `url: "https://example.com/mcp"`, `headers: {"Authorization": "Bearer API_KEY"}`, and `disabled: undefined`

#### Scenario: Parse VS Code sse server as http
- **WHEN** reading `{ "type": "sse", "url": "https://example.com/sse" }`
- **THEN** universal model has `transport: "http"` and `url: "https://example.com/sse"`

### Requirement: Ignore VS Code-only top-level metadata
The translator SHALL operate only on entries under the `servers` key and SHALL not require or synthesize VS Code top-level `inputs` metadata.

#### Scenario: Preserve input placeholders as literal strings
- **WHEN** a VS Code server entry contains `env: {"API_KEY": "${input:api-key}"}`
- **THEN** the universal model preserves `"${input:api-key}"` as the env value string
