# AGENTS.md - Operational Guide

Keep this file under 60 lines. It's loaded every iteration.

## Build Commands

```bash
npm run dev            # Development server
npm run build          # Production build
npm run preview        # Preview production build
```

## Test Commands

```bash
npm run test           # Run tests once
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Coverage report
```

## Lint & Format

```bash
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
npm run format         # Format with Prettier
npm run format:check   # Check formatting
npm run check          # TypeScript check via svelte-check
npm run knip           # Find unused exports/dependencies
```

## Validation (run before committing)

```bash
npm run validate       # Run ALL checks (format, lint, check, test, build)
```

## Project Stack

- **Framework**: SvelteKit with Svelte 5
- **Language**: TypeScript
- **Testing**: Vitest + Testing Library
- **Styling**: CSS (no framework)

## Code Patterns

- Use Svelte 5 runes ($state, $derived, $effect)
- Components in src/lib/components/
- Stores/state in src/lib/stores/
- Types in src/lib/types/
- Routes in src/routes/

## Notes

- Add learnings from iterations here
