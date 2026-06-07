## ADDED Requirements

### Requirement: Read Hermes user-scope config
The system SHALL read the `mcp_servers` key from the Hermes user config path and parse each server entry.

#### Scenario: Parse Hermes user config
- **WHEN** `~/.hermes/config.yaml` exists and contains entries under `mcp_servers`
- **THEN** system parses and returns those servers through the Hermes translator

#### Scenario: No Hermes user config exists
- **WHEN** the Hermes user config file does not exist
- **THEN** system returns an empty server list for Hermes user scope

### Requirement: Write Hermes config while preserving unrelated data
The system SHALL read the full Hermes YAML file, modify the `mcp_servers` section, and write back the complete file without altering unrelated data fields.

#### Scenario: Write to existing Hermes config
- **WHEN** adding or removing a server from `~/.hermes/config.yaml`
- **THEN** system preserves unrelated top-level fields and only modifies `mcp_servers`

#### Scenario: Create Hermes config if missing
- **WHEN** writing to Hermes user scope and the config file does not exist
- **THEN** system creates a new YAML file with the `mcp_servers` structure

#### Scenario: Comments and formatting are not guaranteed to be preserved
- **WHEN** system rewrites `~/.hermes/config.yaml`
- **THEN** system preserves the YAML data model for unrelated fields
- **THEN** system does not guarantee preservation of comments, quoting style, or flow-style formatting
