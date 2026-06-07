## Context

`mcps` currently manages MCP server configs for JSON-backed tools. Hermes introduces the first YAML-backed config file in the project and stores MCP servers under `mcp_servers` in a user-scoped config file. The existing architecture already separates tool enumeration, path resolution, config IO, and per-tool translation, so Hermes fits the current structure but requires one new config format and one new translator.

Hermes v1 is intentionally narrow. The user wants Hermes treated like the other supported coding agents, but only for the shared MCP subset: stdio, HTTP, env, headers, and enabled/disabled state. Hermes-specific fields such as `auth: oauth`, `timeout`, `connect_timeout`, TLS settings, tool filtering, prompts/resources toggles, and sampling are out of scope for this change.

## Goals / Non-Goals

**Goals:**
- Add Hermes as a supported CLI target tool.
- Resolve the Hermes user config path correctly on macOS, Linux, and Windows.
- Read and write Hermes `mcp_servers` entries through the existing universal MCP model.
- Preserve unrelated Hermes config data when changing `mcp_servers`.
- Keep Hermes support compatible with existing add/list/copy/compare flows.

**Non-Goals:**
- Supporting Hermes project scope.
- Implementing Hermes OAuth configuration.
- Writing Hermes timeout or connect-timeout values.
- Preserving YAML comments or exact formatting style.
- Expanding the universal model for Hermes-only advanced fields.

## Decisions

### Use Hermes-specific path resolution with user-only scope
Hermes will be added to the existing tool/path resolution layer as a user-only tool.

Rationale:
- It matches Hermes's documented config location.
- It matches the current pattern already used for user-only tools like Cline.
- It keeps scope validation centralized instead of scattering Hermes checks through command code.

Alternatives considered:
- Reuse generic config-io path logic without a Hermes path spec: rejected because the repo already models tool-specific path behavior explicitly.
- Speculate on a project config path: rejected because the docs reviewed only establish a user config file.

### Use normal YAML parse/serialize instead of comment-preserving YAML AST editing
Hermes config IO will parse YAML into data, update only `mcp_servers`, and serialize the full document back.

Rationale:
- Preserving unrelated data is the functional requirement; preserving comments and style is not.
- This is materially simpler and keeps the change small.
- The repo currently favors minimal read-modify-write behavior over rich file-format editing.

Alternatives considered:
- Comment-preserving YAML AST editing: rejected for v1 because it adds complexity with little user-requested value.
- Writing Hermes with ad hoc string manipulation: rejected because it is brittle and harder to test.

### Keep Hermes on the existing universal subset
Hermes translation will use the existing universal server fields: `transport`, `command`, `url`, `env`, `headers`, and `disabled`.

Rationale:
- The requested support is “similar support as other coding agents.”
- Copy/list/compare behavior remains consistent when Hermes participates through the same model.
- It avoids introducing Hermes-only concepts into the cross-tool abstraction.

Alternatives considered:
- Add Hermes-only fields to the universal model now: rejected because the user chose to skip OAuth logic and advanced Hermes options.

### Omit optional Hermes timeout fields when writing
The writer will not emit `timeout` or `connect_timeout` unless a future change adds explicit support.

Rationale:
- Hermes already applies runtime defaults when those keys are absent.
- Omitting them keeps config output cleaner and avoids pretending `mcps` manages more of Hermes than it does.

Alternatives considered:
- Always write Hermes documented defaults: rejected because it adds noise without changing behavior.

### Drop Hermes-only metadata on cross-tool copy
When copying between Hermes and other tools, only universal fields are preserved.

Rationale:
- The user explicitly chose to drop Hermes-only metadata.
- It matches the existing contract of cross-tool translation through the universal model.

Alternatives considered:
- Warn on dropped Hermes-only metadata: rejected for v1 to keep copy behavior simple.

## Risks / Trade-offs

- YAML serialization may rewrite comments, quoting, or flow style -> Mitigation: document that only unrelated data preservation is guaranteed.
- Hermes configs may contain advanced fields on server entries that `mcps` does not model -> Mitigation: preserve untouched top-level data and keep translator behavior limited to the shared subset.
- Adding a YAML dependency increases package surface area -> Mitigation: use a small, well-supported library and cover read/write behavior with focused tests.
- User-only scope introduces another asymmetry in command flows -> Mitigation: mirror the existing Cline handling for unsupported project scope destinations.

## Migration Plan

1. Add Hermes path resolution and scope validation.
2. Add Hermes translator and YAML-backed config read/write support.
3. Extend command flows, filtering, and tool labels to include Hermes.
4. Add unit tests for Hermes paths, translator behavior, and YAML preservation semantics.
5. Add or update CLI integration tests for Hermes add/list/copy/compare flows.

Rollback is straightforward because Hermes support is additive. Reverting the Hermes-specific code paths and dependency restores current behavior for the existing tools.

## Open Questions

- None for v1. Scope, timeout handling, metadata preservation level, and OAuth exclusion were all settled during exploration.
