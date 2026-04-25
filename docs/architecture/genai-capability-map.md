# MZTEK GenAI Capability Map

## Purpose

MZTEK should understand the practical capability ladder behind modern AI product
building so it can help users build correctly without requiring them to master
the whole field themselves.

This knowledge is not for display only. MZTEK should use it to:
- shape better prompts for IDEs and AI tools
- choose simpler and cheaper implementation paths when appropriate
- detect shallow or fake implementations
- explain tradeoffs in plain language
- validate whether claimed GenAI features are actually complete

## Core Rule

Users should not need curriculum-level knowledge for MZTEK to act with
curriculum-level understanding.

## Capability Ladder

### Level 1: GenAI and Prompting Basics

#### MZTEK should understand
- AI vs ML vs DL vs GenAI
- prompt anatomy
- zero-shot, few-shot, ReAct, role-based prompting
- prompt safety, ethics, and basic misuse risk

#### MZTEK should use it for
- rewriting vague user asks into structured prompts
- selecting the right prompting style for a task
- reducing ambiguity before execution
- spotting when the user is asking for prompting to solve a non-prompt problem

#### Validation expectations
- prompt scope is clear
- output shape is explicit
- the task is small enough for one response when appropriate
- the prompt does not pretend prompting alone solves architecture gaps

### Level 2: APIs and Real-World Prompting

#### MZTEK should understand
- chat APIs
- embedding APIs
- API key handling
- request and response handling
- rate limits and retries
- output debugging

#### MZTEK should use it for
- generating safer integration prompts
- requiring env and secret discipline
- checking whether an AI feature is using a real API path
- identifying missing operational concerns

#### Validation expectations
- env variables are declared
- secrets are not hardcoded
- request flow is testable
- failure handling exists

### Level 3: NLP and Intro to RAG

#### MZTEK should understand
- tokenization
- embeddings
- chunking
- semantic search
- retrieval basics
- grounding and citation expectations

#### MZTEK should use it for
- telling users when RAG is appropriate
- stopping users from reaching for fine-tuning too early
- shaping prompts for retrieval-aware systems
- checking whether a "RAG" implementation is just keyword search wrapped in AI wording

#### Validation expectations
- ingestion path exists
- chunking strategy exists
- embedding path exists
- retrieval path exists
- grounded answer path exists

### Level 4: Advanced RAG

#### MZTEK should understand
- multi-hop retrieval
- hallucination reduction
- rerankers
- fallback strategies
- RAG evaluation and optimization

#### MZTEK should use it for
- deciding when simple retrieval is not enough
- advising on reranking or fallback only when justified
- validating claims about "enterprise-grade RAG"
- identifying where trust and answer quality break down

#### Validation expectations
- retrieval quality is measured
- hallucination controls are visible
- reranking exists when complexity demands it
- fallback behavior is defined

### Level 5: AI Agents and Multi-Agent Systems

#### MZTEK should understand
- single-agent vs multi-agent tradeoffs
- ReAct workflows
- tool-using agents
- role-based delegation
- shared memory
- coordination and handoffs
- reasoning chains

#### MZTEK should use it for
- stopping fake multi-agent theater
- telling users when one agent is enough
- generating skill-aware multi-agent prompts
- validating whether agents have real responsibilities and outputs

#### Validation expectations
- agent roles are distinct
- ownership exists
- handoffs are explicit
- shared state exists when needed
- the system is not just one agent pretending to be many

### Level 6: Deployment and Project Integration

#### MZTEK should understand
- FastAPI and service exposure
- UI surfaces like Gradio and Streamlit
- containerization
- monitoring basics
- production integration and operational readiness

#### MZTEK should use it for
- shaping deployable architecture instead of demo-only output
- checking whether AI features are operationally complete
- surfacing missing runtime concerns
- distinguishing prototype-ready from release-ready

#### Validation expectations
- API surface is real
- configuration exists
- runtime path exists
- monitoring or logging basics exist
- deployment assumptions are explicit

### Level 7: Model Internals and LLM Behavior

#### MZTEK should understand
- transformers
- neural network basics
- context windows
- token cost and latency tradeoffs
- open-source vs closed-source model tradeoffs

#### MZTEK should use it for
- choosing local vs cloud model paths
- avoiding unrealistic model assumptions
- explaining why one model path fits better than another
- setting better prompt and routing expectations

#### Validation expectations
- model assumptions match the selected provider
- context size is realistic
- local/cloud privacy decisions are visible

### Level 8: Fine-Tuning and Specialized Model Work

#### MZTEK should understand
- when fine-tuning is justified
- dataset quality concerns
- evaluation needs
- overfitting and maintenance tradeoffs

#### MZTEK should use it for
- stopping users from jumping to fine-tuning too early
- suggesting retrieval, prompting, or workflow changes first
- validating whether fine-tuning claims are backed by real artifacts

#### Validation expectations
- training data exists
- evaluation exists
- the use case actually justifies fine-tuning
- operational ownership is clear

## Runtime Use Inside MZTEK

MZTEK should not load this whole map for every task. It should:

1. classify the user request
2. select the relevant capability levels
3. load the related knowledge packs
4. build the governed prompt
5. validate the returned work against the matching expectations
6. log lessons when a level was misapplied or under-specified

## Example Benefits to Users

### User says
"Add RAG to my product."

### MZTEK should think
- is RAG actually needed?
- is basic retrieval enough?
- do we need embeddings and chunking?
- are rerankers necessary yet?
- what evidence should come back if this is implemented honestly?

### User benefit
- less over-engineering
- better prompt quality
- fewer fake completions
- clearer MVP boundaries

## What This Changes in Product Behavior

This capability map should power:
- prompt construction
- benchmark pack selection
- validation expectations
- idea shaping and MVP guidance
- local/cloud routing choices
- future continuous learning updates

## Short Product Truth

MZTEK should convert advanced GenAI engineering knowledge into simple, safe,
and practical guidance for ordinary builders.
