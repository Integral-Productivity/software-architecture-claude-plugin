# Technology Radar (test fixture)

Mirrors the shape of a real org radar closely enough to exercise the ring
lookup in `hooks/deps-pretooluse.sh`. Two rows are deliberate traps:

- the Adopt `node:test` row's Notes column names **Jest**, which is a
  Hold-ring technology
- the Adopt `esbuild` row's Notes column names **webpack**, which is on no
  ring at all

Notes-column prose must never resolve a ring. Only the Technology cell counts.

## Adopt

| Technology | Category | Notes |
|---|---|---|
| `node:test` + `assert/strict` | Testing (unit) | Built-in; do not introduce Jest |
| esbuild | Build | Prefer over webpack |
| TypeScript | Language | Default for all new projects |

## Trial

| Technology | Category | Notes |
|---|---|---|
| Vitest | Testing | Trial on non-critical repos first |

## Assess

| Technology | Category | Notes |
|---|---|---|
| Deno | Platform | Worth exploring |

## Hold

| Technology | Category | Notes |
|---|---|---|
| Jest | Testing | Use `node:test` instead |
