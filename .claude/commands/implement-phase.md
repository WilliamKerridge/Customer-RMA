# /implement-phase

Implement the specified phase from the Cosworth RMA build guide.

## Usage
```
/implement-phase [phase number] [optional: specific prompt number]
```

Examples:
- `/implement-phase 1` — implement all of Phase 1
- `/implement-phase 2 prompt-2.3` — implement only Prompt 2.3 from Phase 2

## What this command does

1. Opens `docs/Cosworth_RMA_Claude_Code_Guide.md` and locates the specified phase
2. Reads `CLAUDE.md` to confirm project context
3. Reads `docs/cosworth-rma-portal-v2.html` prototype reference for any UI work
4. Reads `.claude/UI_UX_DESIGN.md` for any components that involve UI
5. Implements the phase prompt exactly as specified in the build guide
6. Runs the verification step from the guide
7. Reports what was built and what to check

## Rules
- Always read the build guide prompt in full before writing any code
- Always check the prototype before building any UI component
- Follow the verification step — do not skip it
- If errors occur, fix them before reporting complete
- Never skip ahead to a later phase prompt
