# MZTEK Prompt Feedback Architecture

## Purpose

MZTEK should not only send prompts to IDEs, models, or tools.

It must also:
- analyze the response
- validate what actually happened
- identify why the result was weak, partial, fake, or incorrect
- write that lesson into project memory
- generate a better next prompt using that understanding

This makes prompt construction a governed feedback loop rather than a one-shot
instruction.

## Core Loop

The canonical prompt loop is:

1. User intent arrives.
2. MZTEK builds a governed prompt.
3. Tool or IDE returns output.
4. MZTEK analyzes the output.
5. MZTEK validates expected versus actual outcome.
6. MZTEK classifies the failure or success.
7. MZTEK records the lesson in the ledger.
8. MZTEK builds the next improved prompt.

Short form:

`intent -> prompt -> response -> analysis -> validation -> lesson -> better prompt`

## Required Subsystems

### 1. Prompt Builder

Builds the initial governed prompt from:
- user intent
- project context
- benchmark pack
- relevant knowledge packs
- task graph state
- required proof rules

### 2. Response Analyzer

Reads raw output from the IDE, model, or worker and identifies:
- what was attempted
- what changed
- what was claimed
- what evidence was returned
- what assumptions were made

### 3. Verification Engine

Checks whether the output actually satisfies the task.

It should compare:
- expected outcome
- actual output
- evidence returned
- benchmark requirements
- dependency closure

### 4. Prompt Critic

Explains why the previous prompt underperformed.

Typical critique categories:
- missing context
- ambiguous scope
- wrong execution target
- weak validation instruction
- missing dependency constraints
- allowed fake completion
- too much asked in one step

### 5. Prompt Improver

Builds the next prompt from the critique.

Typical improvements:
- narrow the scope
- add missing context
- add stronger proof requirements
- add dependency checks
- switch tools or models
- escalate to review or stronger benchmark mode

### 6. Prompt Ledger

Stores prompt history so MZTEK can learn over time.

Each prompt record should include:
- task id
- prompt id
- prompt version
- target tool or model
- expected outcome
- returned outcome
- failure type
- evidence quality
- critique
- next-prompt strategy

## Prompt Lifecycle Hooks

Prompt-aware lifecycle hooks should exist for:
- before prompt build
- before dispatch
- after response receipt
- after validation
- on prompt failure
- on retry
- on escalation
- on success

## Prompt Quality Dimensions

MZTEK should judge prompts on:
- clarity
- scope discipline
- dependency awareness
- benchmark alignment
- proof requirements
- execution fit
- recovery readiness

## Failure Classes

Prompt failures should be classified into reusable buckets:
- vague prompt
- architecture mismatch
- dependency-blind prompt
- validation-blind prompt
- fake-success prompt
- wrong tool prompt
- context-loss prompt
- over-broad prompt

These classes should feed future routing and prompt generation.

## Example

### User intent
`Build signup flow`

### Weak prompt outcome
- frontend form created
- backend route assumed
- env vars missing
- output says "done"

### MZTEK critique
- prompt did not require backend contract proof
- prompt did not force dependency closure
- prompt allowed completion without request evidence

### Better next prompt
- implement backend signup contract first
- return created route and env requirements
- provide runtime proof of a successful request
- do not mark complete without evidence

## MVP Boundary

For MVP, MZTEK does not need a full autonomous self-improving system.

It does need:
- prompt record structure
- response analysis categories
- verification-driven critique
- next-prompt improvement logic

That is enough to make prompt quality improve across iterations instead of
repeating the same failure.

## Current Implementation Status

The current foundation now includes:
- prompt ledger storage in project state
- prompt history exposure through the CLI
- prompt ledger visibility in the dashboard

The next meaningful step is to make critique and improvement logic more automatic
instead of relying on manual recording.
