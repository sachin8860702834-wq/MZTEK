# MZTEK Product Boundary

## Core Rule

MZTEK is the product.

Career Mantra and any future project examples are sample domains used for:
- testing
- validation scenarios
- benchmark design
- reusable pattern extraction

They are not the product itself.

## Repository Lanes

### 1. Product Lane
Location:
- `src/`
- `package.json`

Purpose:
- core MZTEK runtime
- CLI
- notebook/memory engine
- task graph
- validator
- benchmark logic
- future dashboard and integrations

### 2. Sample Lane
Location:
- `samples/`
- `tests/fixtures/`
- `docs/samples/`

Purpose:
- realistic sample projects
- regression scenarios
- domain-specific test cases
- product simulations used to harden MZTEK

### 3. Reusable Library Lane
Location:
- `library/`

Purpose:
- reusable benchmark packs
- future validation packs
- reusable workflow patterns
- future templates and product recipes

### 4. Evidence and Documentation Lane
Location:
- `docs/`
- `tests/`

Purpose:
- planning and architecture
- build board
- acceptance criteria
- testing scenarios
- evidence of what was validated

## Zero-Trust Rule For Progress

Nothing should be treated as complete because it was described, intended, or
claimed.

Success must be tied to evidence such as:
- passing tests
- reproducible CLI behavior
- validated fixture outcomes
- documented benchmark packs
- deterministic generated project state

## Practical Implication

When a sample project teaches MZTEK something useful:
- keep the sample in `samples/`
- keep test scenarios in `tests/fixtures/`
- keep reusable knowledge in `library/`
- keep the actual product logic in `src/`

This prevents sample-project drift from becoming product confusion.
