## Context

`mcps add` currently has two modes: a fully explicit flag-driven path and an interactive wizard that collects transport details from the user. The command already converges on a universal `McpServer` object and relies on tool-specific translators only at write time, which makes it a good fit for a preset lookup layer. The open design question is where catalog data should live and whether runtime behavior should depend on a network fetch.

The project already has a Claude Code translator that can convert Claude-shaped config into `McpServer`. Separately, npm publishing currently only includes `dist/**/*.js`, `dist/**/*.d.ts`, and `dist/**/*.d.ts.map`, so any bundled catalog asset must be emitted into `dist` as part of the build.

## Goals / Non-Goals

**Goals:**
- Make `mcps add <name>` noticeably easier for well-known MCP servers by offering a preset before manual transport prompts.
- Keep preset-derived configurations tool-agnostic at runtime by normalizing them into `McpServer` before writing.
- Preserve offline, deterministic CLI behavior by shipping a bundled catalog snapshot with the package.
- Allow catalog maintenance to happen outside the main CLI repo without making live network access a requirement.
- Preserve the existing manual add flow when no preset exists or the user chooses manual entry.

**Non-Goals:**
- Replacing the existing non-interactive flag flow or inferring values when the user already provided explicit transport flags.
- Building a live catalog sync system as part of this change.
- Introducing fuzzy search, interactive browsing, or rich preset metadata beyond what is needed to prefill config.
- Changing translator output formats for Claude Code, OpenCode, or Cline.

## Decisions

1. Use a hybrid catalog model: external source repository plus bundled snapshot in the CLI package.
Rationale: this separates catalog maintenance from CLI release work while keeping `mcps add` fast, offline-capable, and resilient to network failures.
Alternative considered: fetching the GitHub-hosted catalog at runtime. Rejected because it adds latency, test fragility, and a new failure mode to a core command.

2. Treat the bundled catalog snapshot as a runtime asset stored alongside the preset loader source and copied into `dist/catalog/` during the build.
Rationale: this keeps the asset close to the code that owns it while preserving a self-contained published package that reads only from `dist` at runtime.
Alternative considered: storing the source file only in the repository root and reading it directly at runtime. Rejected because installed packages should not depend on repository-only paths or extra publish allowlist exceptions.

3. Use the existing Claude Code translator as the ingestion path for the initial catalog format.
Rationale: the current external catalog is Claude-shaped (`mcpServers` entries with `command`/`args`, `type`, `url`, `env`, `headers`), and `fromClaudeCode()` already converts that shape into `McpServer`. Reusing it keeps the first iteration small and avoids introducing a second parallel normalization path.
Alternative considered: creating a new catalog-only schema immediately. Rejected for the first increment because it increases scope before validating the user-facing preset flow.

4. Scope preset lookup to the interactive add path and keep explicit flags authoritative.
Rationale: users who already supplied complete transport flags are asking for deterministic behavior, not suggestions. Presets are most valuable where the command would otherwise ask the user to type known values manually.
Alternative considered: auto-filling missing values in partially flagged invocations. Rejected because it blurs the contract of non-interactive usage and complicates validation rules.

5. Show an action step when a preset is found, allowing the user to use it directly, edit the discovered values first, or continue with full manual entry.
Rationale: known MCP names should feel easy, but the tool should not silently install remote endpoints or placeholder auth headers without giving users a chance to adjust preset values such as API key placeholders.
Alternative considered: automatically using the preset whenever a name matches. Rejected because it removes user control and makes it harder to intentionally create a custom server under the same name.

## Risks / Trade-offs

- Bundled snapshot can become stale between CLI releases. → Keep the source catalog external so refreshing the snapshot is straightforward, and treat live updates as a future enhancement rather than a runtime dependency.
- Claude-shaped source data carries some source-format coupling. → Limit that coupling to ingestion only and normalize immediately into `McpServer`.
- Preset entries may include placeholder secrets such as `YOUR_GITHUB_PAT`. → Show the discovered values and provide an edit path before writing so users can replace placeholders inline.
- Simple string matching may still miss aliases such as `gh` versus `github`. → Normalize case for lookup in this version, but leave aliases and fuzzy matching for future work.

## Migration Plan

No user data migration is required. Ship the bundled snapshot with the CLI, copy it into `dist/catalog/` during the build, update `mcps add` to consult it during the interactive flow, and preserve manual entry behavior for all names that do not resolve to a preset.

If the packaged snapshot is missing or unreadable at runtime, the command should continue with the existing manual prompts rather than failing the add flow.

## Open Questions

- Whether the project should later promote the catalog source of truth from Claude-shaped config to a dedicated tool-agnostic preset schema.
- Whether a future release should support aliases or fuzzy matching beyond the current case-insensitive exact-name lookup.
