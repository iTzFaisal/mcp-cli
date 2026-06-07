## Why

`mcps` currently supports several coding agents, but not Hermes Agent. Users who manage MCP servers across tools cannot use the CLI to inspect, add, copy, compare, or remove Hermes MCP entries, even though Hermes uses the same core MCP concepts and is a relevant target alongside the other supported agents.

## What Changes

- Add Hermes Agent as a supported target tool in the CLI.
- Add user-scope Hermes config path resolution for macOS, Linux, and Windows.
- Add Hermes YAML config reading and writing for the `mcp_servers` section in `~/.hermes/config.yaml`.
- Add Hermes translator support for stdio and HTTP MCP servers using the existing universal model fields.
- Update add/list/copy/compare command behavior and help text so Hermes appears alongside the other supported coding agents.
- Preserve unrelated Hermes config data when modifying `mcp_servers`, without guaranteeing preservation of comments or formatting style.
- Exclude Hermes OAuth and timeout-specific configuration from v1 support.

## Capabilities

### New Capabilities
- `hermes-paths`: Resolve Hermes user config paths and user-only scope behavior across platforms.
- `hermes-translator`: Translate Hermes MCP server entries to and from the universal model and `mcp_servers` container.

### Modified Capabilities
- `config-io`: Add Hermes YAML config discovery, reading, and write-preservation behavior.
- `mcp-add`: Allow Hermes in interactive and non-interactive add flows and apply Hermes user-only scope behavior.
- `mcp-list`: Include Hermes in unified listing and tool filtering.
- `mcp-copy`: Allow Hermes as a copy source and destination using the universal model while dropping Hermes-only metadata.
- `mcp-compare`: Include Hermes user scope in supported comparison destinations and missing-location hints.

## Impact

- Affected code: tool enumeration, config path resolution, config reader/writer, new Hermes translator, and command flows that enumerate supported tools.
- Affected storage format: introduces YAML parsing and serialization for Hermes config in addition to existing JSON-backed tools.
- Dependencies: likely requires a YAML library or use of an existing one already present in the project.
- Platform impact: Hermes user config path must resolve correctly on macOS, Linux, and Windows.
