# MZTEK Discovery and Companion Architecture

## Purpose

MZTEK should help the user in two high-value ways beyond build execution:

1. It should act like a grounded project companion that can keep the user
   informed through text and, later, natural voice.
2. It should help shape ideas early by researching the market, finding
   comparable products, surfacing whitespace, and guiding the user toward a
   stronger product direction.

These are support layers around project truth, not replacements for project
truth.

## 1. Voice Companion Layer

### Role

The voice companion is a presentation and interaction layer over grounded
project state.

It should:
- read real project updates aloud
- answer natural spoken questions
- summarize blockers, progress, and next steps
- keep the user engaged without requiring them to inspect raw state

### What it should speak from

It must be grounded in:
- task graph
- validation results
- benchmark gaps
- prompt outcomes
- decisions and project memory

### Good examples

- "You are in Phase 4 and the next task is the prompt ledger."
- "The latest validation still shows a critical benchmark gap around encryption proof."
- "The last prompt failed because the output claimed completion without evidence."

### Bad examples

- vague encouragement with no project truth
- status claims not tied to tracked state
- personality over clarity

### Placement

This is a post-core UX multiplier, not a core MVP dependency.

## 2. Idea Shaping and Market Intelligence Layer

### Role

When a user shares an idea, MZTEK should help them understand:
- who else is doing something similar
- what already exists in the market
- what differentiators are possible
- what should be part of the MVP
- what should wait until later

This turns MZTEK into a strategic product-shaping partner, not just a build
governor.

### Inputs

- rough idea statement
- target users
- market/region
- desired outcome
- constraints

### Outputs

- competitor/comparable product map
- what is common versus differentiated
- likely crowded areas
- suggested wedge
- MVP scope recommendation
- stronger future expansion ideas

### Important rule

This layer should not push the user to build everything.

It should:
- broaden understanding
- reduce blind spots
- sharpen the wedge
- keep the MVP disciplined

## Research Workflow

The market intelligence loop should work like this:

1. Capture idea summary.
2. Search for comparable products and related categories.
3. Summarize what they appear to do.
4. Compare the user idea to current alternatives.
5. Identify overlap, differences, and whitespace.
6. Recommend:
   - what to keep in MVP
   - what to postpone
   - what could become a stronger differentiator later

## Guardrails

### For voice
- do not invent progress
- do not narrate from stale state
- do not become noisy

### For market research
- do not assume a product is unique without checking
- do not copy competitors blindly
- do not expand MVP just because more ideas are possible
- do not confuse "interesting" with "must build now"

## Product Value

Together, these two layers make MZTEK feel like:
- a grounded build companion during execution
- a strategic thinking partner during idea formation

That combination can be especially helpful for non-technical users who need both
clarity and confidence.
