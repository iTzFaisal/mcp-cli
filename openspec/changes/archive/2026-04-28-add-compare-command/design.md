## Context

The CLI already has the core pieces needed to reason about MCP coverage across tools: `readServers()` can discover configured servers in the universal model, supported tool/scope combinations are defined by the config path layer, and the `copy` command already establishes how a user can replicate one configuration into another location. What is missing is a command focused on coverage analysis: for a single server name, users need to see every supported location where it exists, every supported location where it does not, and the exact next command to close each gap.

## Goals / Non-Goals

**Goals:**
- Add a `compare` command that reports coverage for one MCP server across all supported tool/scope locations
- Support direct non-interactive usage with a provided server name
- Support an interactive flow that helps the user choose a server name and, when needed, a preferred source location for generated copy hints
- Generate valid `mcps copy` hint commands for each missing supported location
- Keep destination coverage aligned with the repo's real support matrix, including Cline being user-scope only

**Non-Goals:**
- Performing the copy directly from `compare`
- Comparing multiple server names in one invocation
- Adding new persistence formats or changing translator behavior
- Supporting unsupported destinations such as Cline project scope

## Decisions

### 1. Command shape: `compare [name]`
The command will accept an optional positional name. When `name` is provided, it behaves non-interactively and prints the comparison immediately. When `name` is omitted in a TTY, the command enters an interactive flow that lets the user choose from discovered server names. This keeps the scripting path simple while still offering an interactive entry point.

Alternative considered: require `<name>` always and add a separate `--interactive` flag. Rejected because it adds friction to the interactive case without improving the non-interactive path.

### 2. Compare against the explicit support matrix
The comparison targets will be a fixed list of supported locations: Claude Code user/project, OpenCode user/project, and Cline user. The command will not report unsupported destinations as "missing" because that would imply the user can copy there when they cannot.

Alternative considered: derive every tool/scope pair mechanically and mark unsupported pairs separately. Rejected because it makes the output noisier and less actionable.

### 3. Generate copy hints from a single preferred source
Hints need a concrete source location so they are runnable. If the server exists in one place, that location becomes the source automatically. If the server exists in multiple places, interactive mode will prompt the user to choose the source location for hint generation. Non-interactive mode will choose a stable preferred source ordering and include `--from-tool` and `--from-scope` in every generated hint so the command remains unambiguous.

Alternative considered: emit one hint per source/destination pair. Rejected because it multiplies output and obscures the primary next action.

### 4. Reuse existing discovery and rendering patterns
Implementation should reuse `readServers()` for discovery and existing tool/scope enums so compare output stays consistent with `list`, `copy`, and `move`. Output should be plain CLI text rather than a table abstraction to keep the implementation small and the tests stable.

Alternative considered: introduce a shared formatter module for compare/list/move output. Rejected because compare can be implemented with a small local formatter and does not yet justify a new abstraction.

### 5. Show useful output even when the server is missing everywhere
If a server name is not configured in any supported location, the command should still return a complete comparison result showing that every supported location is missing, along with a note that copy hints are unavailable until the server exists somewhere. This is more informative than failing immediately.

Alternative considered: exit with an error when no configured locations are found. Rejected because the compare result itself answers the user's question.

## Risks / Trade-offs

- Multiple configured locations can make hint generation subjective -> Use explicit interactive selection and stable non-interactive ordering so hints stay deterministic
- Interactive server-name selection can be awkward if many servers exist -> Show a simple select list sourced from unique discovered names rather than a multi-step wizard
- Output formatting may become verbose as support expands -> Keep the comparison logic based on a central supported-location list so future formatting changes remain localized
- Comparing a server that only exists in project scope depends on project-root resolution -> Reuse the existing config path behavior so compare reflects the same scope detection as the rest of the CLI

## Migration Plan

No data migration is required. The command is additive and reads existing config files without changing their schema.

## Open Questions

No open questions remain for the initial implementation. If later requested, JSON output can be added as a follow-up enhancement rather than being part of this change.
