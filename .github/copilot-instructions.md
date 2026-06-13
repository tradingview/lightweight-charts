# Copilot Instructions for WTrading

## Project overview
- This repository is a fork/customization of `tradingview/lightweight-charts`.
- Preserve performance characteristics of the charting engine, especially on canvas rendering paths.
- Prefer minimal, focused changes over broad refactors.

## Tech stack
- Primary languages are TypeScript and JavaScript.
- Keep public APIs and type definitions consistent.
- Avoid introducing heavy dependencies unless explicitly required.

## Coding guidelines
- Follow the existing code style and nearby file conventions.
- Prefer TypeScript-first changes when editing typed modules.
- Keep rendering code allocation-conscious and avoid unnecessary work in hot paths.
- Do not rename public symbols unless required.
- Preserve backward compatibility unless a task explicitly allows breaking changes.

## Testing and validation
- Run or update the most relevant tests for changed code.
- For visual/chart behavior changes, describe expected rendering impact clearly in PR notes.
- Avoid changing unrelated snapshots or fixtures.

## Repository-specific guidance
- Treat this repo as performance-sensitive charting software.
- Be careful with floating-point/math logic used for indicators or prediction-related features.
- When modifying averages, highs/lows, or derived calculations, prefer small diffs and explain assumptions.

## Pull request expectations
- Summarize what changed and why.
- Call out any API, rendering, or performance implications.
- Mention follow-up work separately instead of bundling it into the same change.
