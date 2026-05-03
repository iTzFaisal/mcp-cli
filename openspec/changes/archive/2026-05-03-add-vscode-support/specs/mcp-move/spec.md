## MODIFIED Requirements

### Requirement: Non-interactive move
The move command SHALL support a non-interactive mode when `--tool` and `--scope` flags are both provided.

#### Scenario: Move server with all flags specified
- **WHEN** user runs `mcps move myserver --tool opencode --scope user`
- **THEN** the system locates the server, writes it to the target tool/scope, removes it from the source, and prints a success message

#### Scenario: Move with explicit source flags
- **WHEN** user runs `mcps move myserver --tool opencode --scope user --from-tool claude --from-scope project`
- **THEN** the system moves the server from the specified source to the destination

#### Scenario: Move to all tools
- **WHEN** user runs `mcps move myserver --tool all --scope user`
- **THEN** the system writes the server to Claude Code, OpenCode, Cline, and VS Code at the target scope, then removes from the source

#### Scenario: Missing required flags triggers error
- **WHEN** user runs `mcps move myserver --tool opencode` without `--scope`
- **THEN** the system enters interactive mode to prompt for the missing scope

#### Scenario: Same source and destination rejected
- **WHEN** user runs `mcps move myserver --tool claude --scope user --from-tool claude --from-scope user`
- **THEN** the system exits with an error indicating source and destination are the same

#### Scenario: Overwrite without force rejected
- **WHEN** the target location already has a server with the same name and `--force` is not set
- **THEN** the system exits with an error indicating the server exists and suggesting `--force`

#### Scenario: Overwrite with force succeeds
- **WHEN** the target location already has a server with the same name and `--force` is set
- **THEN** the system overwrites the destination, removes the source, and prints a success message

#### Scenario: Server not found
- **WHEN** the server name does not exist in any config
- **THEN** the system exits with an error indicating the server was not found

#### Scenario: Ambiguous source in non-interactive mode
- **WHEN** the server exists in multiple locations and `--from-tool`/`--from-scope` are not specified
- **THEN** the system exits with an error listing all locations and suggesting `--from-tool` and `--from-scope`

### Requirement: Interactive move
The move command SHALL launch an interactive wizard when `--tool` and `--scope` are not both provided.

#### Scenario: Single source auto-detected
- **WHEN** the server exists in exactly one location
- **THEN** the system displays the detected location and proceeds to prompt for destination

#### Scenario: Multiple sources prompt selection
- **WHEN** the server exists in more than one location
- **THEN** the system prompts the user to select which source to move from

#### Scenario: Destination tool selection
- **WHEN** the interactive wizard runs
- **THEN** the system prompts the user to select from: Claude Code, OpenCode, Cline, VS Code, or All

#### Scenario: Destination scope selection
- **WHEN** the interactive wizard runs
- **THEN** the system prompts the user to select from: User (global) or Project

#### Scenario: Interactive overwrite confirmation
- **WHEN** the target location already has a server with the same name
- **THEN** the system prompts the user to confirm overwriting before proceeding

#### Scenario: Interactive cancel
- **WHEN** the user cancels any prompt
- **THEN** the operation is aborted with no changes made
