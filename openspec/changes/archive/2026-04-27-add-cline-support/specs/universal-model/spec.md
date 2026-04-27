## MODIFIED Requirements

### Requirement: Translate universal model to Claude Code format
The system SHALL convert a universal MCP server object to Claude Code's native JSON schema. If the universal server has `disabled: true`, the field SHALL be omitted from Claude Code output (Claude Code does not support disabled state).

#### Scenario: Translate stdio server to Claude Code
- **WHEN** universal server has `transport: "stdio"` and `command: ["npx", "-y", "server"]`
- **THEN** output is `{ "command": "npx", "args": ["-y", "server"], "env": {...} }`

#### Scenario: Translate http server to Claude Code
- **WHEN** universal server has `transport: "http"`, `url: "https://..."`, `headers: {...}`
- **THEN** output is `{ "type": "http", "url": "https://...", "headers": {...} }`

#### Scenario: Disabled server written to Claude Code
- **WHEN** universal server has `disabled: true`
- **THEN** Claude Code output omits the `disabled` field

### Requirement: Translate universal model to OpenCode format
The system SHALL convert a universal MCP server object to OpenCode's native JSON schema. The `disabled` field SHALL be mapped to OpenCode's inverted `enabled` field.

#### Scenario: Translate stdio server to OpenCode
- **WHEN** universal server has `transport: "stdio"`, `command: ["npx", "-y", "server"]`, `disabled: false`
- **THEN** output is `{ "type": "local", "command": ["npx", "-y", "server"], "environment": {...}, "enabled": true }`

#### Scenario: Translate disabled server to OpenCode
- **WHEN** universal server has `disabled: true`
- **THEN** output includes `"enabled": false`

### Requirement: Translate Claude Code format to universal model
The system SHALL parse Claude Code's native server format into the universal model. The `disabled` field SHALL be `undefined` since Claude Code does not have this concept.

#### Scenario: Parse Claude Code stdio server
- **WHEN** reading `{ "command": "npx", "args": ["-y", "server"], "env": {"KEY": "val"} }`
- **THEN** universal model has `transport: "stdio"`, `command: ["npx", "-y", "server"]`, `env: {"KEY": "val"}`, `disabled: undefined`

### Requirement: Translate OpenCode format to universal model
The system SHALL parse OpenCode's native server format into the universal model. OpenCode's `enabled` field SHALL be mapped to the inverted `disabled` field.

#### Scenario: Parse OpenCode local server with enabled state
- **WHEN** reading `{ "type": "local", "command": ["npx", "-y", "server"], "enabled": true }`
- **THEN** universal model has `disabled: false`

#### Scenario: Parse OpenCode local server with disabled state
- **WHEN** reading `{ "type": "local", "command": ["npx", "-y", "server"], "enabled": false }`
- **THEN** universal model has `disabled: true`

#### Scenario: Parse OpenCode server without enabled field
- **WHEN** reading `{ "type": "local", "command": ["npx", "-y", "server"] }` (no `enabled` field)
- **THEN** universal model has `disabled: undefined`
