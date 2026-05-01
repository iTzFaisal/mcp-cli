## Why

Adding well-known MCP servers still requires users to manually type transport details, URLs, commands, headers, and environment variable placeholders even when those parameters are already known. A preset-backed add flow would make common servers faster to install, reduce copy/paste errors, and let the project maintain a curated catalog without coupling day-to-day command usage to a live network fetch.

## What Changes

- Update `mcps add <name>` so it can look up a matching preset from a bundled MCP catalog snapshot before falling back to manual entry.
- When a preset is found, show the user that a configuration was found and let them use it directly, edit the discovered values first, or continue with full manual entry.
- Normalize catalog entries into the existing universal `McpServer` model so Claude-style source data can still be written to Claude Code, OpenCode, and Cline via the current translators.
- Define how the catalog is packaged with the CLI so published npm installs include an offline snapshot while still allowing the source catalog to live in a separate repository.
- Add tests that cover preset discovery, acceptance, edit-before-add behavior, decline/fallback behavior, and cross-tool translation from catalog-derived entries.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `mcp-add`: add should offer a preset-driven path for known MCP servers before manual transport prompts, while preserving manual entry as a fallback.

## Impact

- Affected code: `src/commands/add.ts`, shared config/preset loading support, packaging/build setup, and add command tests.
- Affected UX: interactive `mcps add` flow for known MCP server names.
- External system impact: catalog source management may live in a separate repository, but the CLI will consume a bundled snapshot at runtime.
