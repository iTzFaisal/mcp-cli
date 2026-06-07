## Purpose

Define how Hermes MCP server entries are translated to and from the universal MCP server model.

## Requirements

### Requirement: Translate universal model to Hermes format
The system SHALL convert a universal MCP server object to Hermes's native YAML server schema under `mcp_servers`.

#### Scenario: Translate stdio server to Hermes
- **WHEN** universal server has `transport: "stdio"`, `command: ["npx", "-y", "server"]`, and `env: {"KEY": "val"}`
- **THEN** output is `{ "command": "npx", "args": ["-y", "server"], "env": {"KEY": "val"} }`

#### Scenario: Translate http server to Hermes
- **WHEN** universal server has `transport: "http"`, `url: "https://example.com/mcp"`, and `headers: {"Authorization": "Bearer API_KEY"}`
- **THEN** output is `{ "url": "https://example.com/mcp", "headers": {"Authorization": "Bearer API_KEY"} }`

#### Scenario: Translate disabled server to Hermes
- **WHEN** universal server has `disabled: true`
- **THEN** output includes `enabled: false`

#### Scenario: Omit Hermes-only optional fields when writing
- **WHEN** universal server is translated to Hermes format
- **THEN** output omits Hermes-only optional fields not represented in the universal model, including `auth`, `timeout`, and `connect_timeout`

### Requirement: Translate Hermes format to universal model
The system SHALL parse Hermes server entries from `mcp_servers` into the universal model.

#### Scenario: Parse Hermes stdio server
- **WHEN** reading `{ "command": "node", "args": ["server.js"], "env": {"KEY": "val"} }`
- **THEN** universal model has `transport: "stdio"`, `command: ["node", "server.js"]`, `env: {"KEY": "val"}`

#### Scenario: Parse Hermes http server
- **WHEN** reading `{ "url": "https://example.com/mcp", "headers": {"Authorization": "Bearer API_KEY"} }`
- **THEN** universal model has `transport: "http"`, `url: "https://example.com/mcp"`, and `headers: {"Authorization": "Bearer API_KEY"}`

#### Scenario: Parse Hermes disabled server
- **WHEN** reading `{ "url": "https://example.com/mcp", "enabled": false }`
- **THEN** universal model has `transport: "http"`, `url: "https://example.com/mcp"`, and `disabled: true`

#### Scenario: Ignore Hermes-only advanced fields when parsing
- **WHEN** reading a Hermes server entry containing `auth: oauth`, `timeout: 180`, or `connect_timeout: 10`
- **THEN** the universal model omits those fields and still parses the shared transport fields

### Requirement: Top-level key is mcp_servers
The Hermes translator SHALL read from and write to the `mcp_servers` key in the YAML config file.

#### Scenario: Read servers from mcp_servers key
- **WHEN** reading `config.yaml` with `{ "mcp_servers": { "my-server": {...} } }`
- **THEN** system extracts servers from the `mcp_servers` key

#### Scenario: Write servers to mcp_servers key
- **WHEN** writing a server to Hermes config
- **THEN** system places it under the `mcp_servers` key and preserves unrelated top-level fields
