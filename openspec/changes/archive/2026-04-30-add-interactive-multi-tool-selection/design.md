## Context

`mcps add` already supports writing one server definition to multiple destinations in non-interactive mode through `--tool all`, but the interactive wizard still uses a single-select prompt for tools. The command already loops over one or more targets after building the `McpServer` payload, so the main gap is collecting multiple interactive targets in a way that preserves existing validation, overwrite prompts, and the special case where Cline cannot write project-scoped config.

## Goals / Non-Goals

**Goals:**
- Let interactive `mcps add` users choose any combination of Claude Code, OpenCode, and Cline in one prompt.
- Reuse the existing write loop so one collected server definition can be applied to each selected target.
- Preserve current behavior for non-interactive flags, transport-specific prompts, overwrite confirmation, and the Cline project-scope warning.
- Add tests that prove multi-target interactive writes and partial skips behave correctly.

**Non-Goals:**
- Changing non-interactive CLI flags or adding new flag aliases.
- Introducing batch scope selection or different per-tool transport settings.
- Changing config writer behavior or native config formats for any tool.

## Decisions

1. Replace the interactive tool `select` prompt with `clack.multiselect`.
Rationale: the prompt library already supports space-to-toggle multi-selection and returns an array of selected values, which directly matches the user-facing requirement without introducing a new dependency.
Alternative considered: keeping the current single-select prompt and adding extra follow-up prompts for additional tools. Rejected because it adds more steps and makes the workflow slower than a single multi-select interaction.

2. Remove the interactive `All` option and treat the selected tool array as the source of truth.
Rationale: once users can select multiple tools directly, `All` becomes redundant in the interactive flow and complicates state handling by mixing symbolic and explicit selections.
Alternative considered: keeping `All` alongside individual tools. Rejected because it creates ambiguous combinations such as selecting `All` plus one tool and forces extra normalization rules.

3. Normalize interactive selections into the same downstream target iteration path already used for `all` in non-interactive mode.
Rationale: the existing add flow already builds a server once, checks for existing entries per destination, skips unsupported Cline project writes, and writes each supported target independently. Reusing that path keeps the change small and lowers regression risk.
Alternative considered: adding a separate interactive-only write branch. Rejected because it would duplicate overwrite and skip logic.

4. Add focused command tests by mocking the new multi-select prompt result.
Rationale: current `add` tests already mock Clack prompts and verify prompt-dependent writes. Extending that pattern is the smallest way to lock in multi-tool behavior.
Alternative considered: covering the change only through CLI integration tests. Rejected because unit tests are faster and more precise for prompt branching.

## Risks / Trade-offs

- Multi-select prompt behavior differs from single-select discovery for first-time users. → Use a clear prompt message that implies selecting multiple tools.
- Interactive writes may produce a mix of success, overwrite skips, and unsupported-target skips in one run. → Keep per-target logging so outcomes stay explicit.
- Test mocks may drift if prompt APIs change. → Keep tests focused on returned values and observable writes rather than prompt internals.

## Migration Plan

No data migration is required. Ship the updated command behavior with test coverage, then update help text or README examples if implementation changes the documented interactive wording.

## Open Questions

- None.
