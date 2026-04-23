# Career Mantra OS Sample Project

## Why This Sample Matters

Career Mantra OS is a strong MZTEK sample project because it is:
- product-rich rather than code-only
- multi-system by design
- privacy-sensitive
- automation-heavy
- strongly dependent on real-world workflow correctness

It gives MZTEK a realistic project to test:
- product understanding
- dependency tracking
- security-first review
- zero-trust validation
- release-readiness thinking

## Core Product Summary

Career Mantra OS is designed as an operating system for job search in India.

It is not only a job board or resume optimizer. It aims to automate the
repetitive workflow around job discovery, application tracking, resume
tailoring, form filling, follow-up, and interview preparation while keeping the
user in control.

## Primary Product Thesis

The real bottleneck in job search is not matching quality, but time lost to
repetitive manual execution.

Career Mantra OS tries to reduce job-search work from many hours per week to a
few minutes per day by:
- scanning multiple Indian job portals
- deduplicating jobs
- scoring matches
- tailoring resumes
- generating cover letters
- auto-filling applications
- tracking submissions
- helping with interview preparation

## Notable Architecture Signals

- Frontend: Next.js, TypeScript, Tailwind
- State: Zustand with persistence
- Automation: Playwright
- AI: Gemini cloud inference with optional Ollama and Gemma local inference
- Voice: Web Speech API
- Privacy posture: local-first and cloud opt-in

## Product Constraints MZTEK Can Test Against

- Human-in-the-loop requirements
- Cross-platform automation correctness
- Security and privacy expectations
- Local versus cloud model routing
- Proof of submission and application traceability
- India-specific domain logic

## Reusable MZTEK Lessons From This Sample

- A product can be user-simple while system-complex.
- Human-in-the-loop flows need explicit checkpoints and proof artifacts.
- Privacy claims must be tested as real architecture choices, not slogans.
- Automation-heavy products require strong dependency and validation tracking.
- Region-specific domain logic should be treated as first-class product context.
