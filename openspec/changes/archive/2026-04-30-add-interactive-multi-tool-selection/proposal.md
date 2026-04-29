## Why

The interactive `mcps add` flow only allows selecting one tool or the special `All` option, which forces users to either write to every supported tool or rerun the command multiple times. Supporting multi-select makes targeted cross-tool setup faster and better matches the command's goal of managing one MCP definition across multiple clients.

## What Changes

- Update the interactive `mcps add` wizard so tool selection supports choosing multiple tools with the keyboard instead of a single-select menu.
- Keep the existing `all` behavior for non-interactive flag usage, while making the interactive flow write the server to each explicitly selected tool.
- Preserve existing scope, transport, overwrite confirmation, and Cline project-scope skip behavior when multiple tools are selected.
- Add tests that cover interactive multi-tool selection, including mixed supported and skipped targets.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `mcp-add`: interactive add should allow selecting multiple target tools in one run and apply the same server configuration to each selected tool.

## Impact

- Affected code: `src/commands/add.ts`, interactive prompt handling, and add command tests.
- Affected UX: interactive add flow for tool selection.
- No new dependencies or config file formats are required.
