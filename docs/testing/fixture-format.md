# MZTEK Fixture Format

These fixtures are intentionally simple so they can be used before the full runtime exists.

Each JSON fixture should contain:

- `fixture_id`: stable identifier
- `name`: short scenario name
- `category`: scenario family
- `project_type`: type of product or feature
- `goal`: what the user believes is being built
- `user_prompt`: rough user request
- `context`: current known project state
- `agent_output`: what the AI tool or IDE claims
- `evidence`: proof artifacts currently available
- `dependencies`: required dependencies and their status
- `expected_mztek_result`: the correct zero-trust decision

## Core Result Fields

`expected_mztek_result` should include:

- `status`
- `severity`
- `summary`
- `findings`
- `missing_proof`
- `missing_dependencies`
- `next_actions`

## Status Guidance

Use one of:

- `validated`
- `in_progress`
- `blocked`
- `suspicious`
- `failed`

## Fixture Design Principles

- Keep examples realistic enough to mirror actual vibe-coding failures.
- Prefer incomplete evidence over invented test coverage.
- Include at least one concrete reason for every blocked or suspicious state.
- Make the fixture understandable without external files.
- Preserve reusable language so these scenarios can later become regression tests.
