## Why

Remote MCP servers currently follow the wrong data collection path during `mcps add`: after selecting `http`, the CLI still asks for environment variables instead of the remote authorization value. This produces incorrect configuration for authenticated remote servers and makes remote server setup inconsistent across interactive and non-interactive usage.

## What Changes

- Update the `add` command so `stdio` servers continue to collect environment variables, while `http` servers collect headers in the same comma-separated `KEY=VALUE` style and write them to remote config headers.
- Add non-interactive support for passing remote authorization when adding `http` MCP servers.
- Preserve remote headers for Cline in the universal model and translator layer so copy and move operations keep authenticated remote server settings intact across tools.
- Add tests covering remote authenticated server creation and cross-tool preservation for interactive and non-interactive flows.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `mcp-add`: change remote add flows to prompt for headers instead of environment variables, using the same comma-separated `KEY=VALUE` style as `env` with `Authorization=Bearer API_KEY,OTHER=val` as the interactive placeholder.
- `mcp-copy`: make remote authenticated server copies preserve authorization headers when Cline is a source or destination.
- `mcp-move`: make remote authenticated server moves preserve authorization headers when Cline is a source or destination.
- `cline-translator`: add remote header round-tripping for Cline remote MCP server entries.

## Impact

- Affected code: `src/commands/add.ts`, `src/translators/cline.ts`, related read/write paths, and command/translators tests.
- Affected behavior: interactive `mcps add`, flagged `mcps add`, and any copy/move path that reads or writes authenticated remote MCP servers.
- No new runtime dependencies are expected.
