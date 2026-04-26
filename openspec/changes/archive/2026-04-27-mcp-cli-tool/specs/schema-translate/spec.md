## ADDED Requirements

### Requirement: Translate universal model to Claude Code format
The system SHALL convert a universal MCP server object to Claude Code's native JSON schema.

#### Scenario: Translate stdio server to Claude Code
- **WHEN** universal server has `transport: "stdio"` and `command: ["npx", "-y", "server"]`
- **THEN** output is `{ "command": "npx", "args": ["-y", "server"], "env": {...} }`

#### Scenario: Translate http server to Claude Code
- **WHEN** universal server has `transport: "http"`, `url: "https://..."`, `headers: {...}`
- **THEN** output is `{ "type": "http", "url": "https://...", "headers": {...} }`

### Requirement: Translate universal model to OpenCode format
The system SHALL convert a universal MCP server object to OpenCode's native JSON schema.

#### Scenario: Translate stdio server to OpenCode
- **WHEN** universal server has `transport: "stdio"` and `command: ["npx", "-y", "server"]`
- **THEN** output is `{ "type": "local", "command": ["npx", "-y", "server"], "environment": {...}, "enabled": true }`

#### Scenario: Translate http server to OpenCode
- **WHEN** universal server has `transport: "http"`, `url: "https://..."`, `headers: {...}`
- **THEN** output is `{ "type": "remote", "url": "https://...", "headers": {...}, "enabled": true }`

### Requirement: Translate Claude Code format to universal model
The system SHALL parse Claude Code's native server format into the universal model.

#### Scenario: Parse Claude Code stdio server
- **WHEN** reading `{ "command": "npx", "args": ["-y", "server"], "env": {"KEY": "val"} }`
- **THEN** universal model has `transport: "stdio"`, `command: ["npx", "-y", "server"]`, `env: {"KEY": "val"}`

#### Scenario: Parse Claude Code http server
- **WHEN** reading `{ "type": "http", "url": "https://...", "headers": {...} }`
- **THEN** universal model has `transport: "http"`, `url: "https://..."`, `headers: {...}`

### Requirement: Translate OpenCode format to universal model
The system SHALL parse OpenCode's native server format into the universal model.

#### Scenario: Parse OpenCode local server
- **WHEN** reading `{ "type": "local", "command": ["npx", "-y", "server"], "environment": {"KEY": "val"} }`
- **THEN** universal model has `transport: "stdio"`, `command: ["npx", "-y", "server"]`, `env: {"KEY": "val"}`

#### Scenario: Parse OpenCode remote server
- **WHEN** reading `{ "type": "remote", "url": "https://...", "headers": {...} }`
- **THEN** universal model has `transport: "http"`, `url: "https://..."`, `headers: {...}`
