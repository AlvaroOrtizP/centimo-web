# Centimo — Agent Guide

## Project Overview

Angular 17.3 standalone application (no NgModules) with Tailwind CSS. TypeScript 5.4, Jasmine 5.1 + Karma 6.4 for testing. No NgRx.

Personal finance dashboard — **mock data only, no backend, no HTTP calls**. All state lives in `FinancialDataService` (signals-based).

## Build / Serve / Test Commands

| Command | Action |
|---|---|
| `npm start` | Dev server at `http://localhost:4200/` |
| `npm run build` | Production build to `dist/centimo` |
| `npm test` | Run all tests via Karma + Chrome |
| `ng test --watch=false` | Run all tests once (no watch) |
| `ng test --code-coverage` | Run with coverage report in `/coverage` |

### Running a Single Test

Karma has no `--grep`. Use Jasmine focused methods:

```typescript
fdescribe('MyComponent', () => { ... });   // run only this suite
fit('should do something', () => { ... });  // run only this test
```

### Adding New Files

Always use Angular CLI to scaffold:

```bash
ng generate component features/my-component
ng generate service core/my-service
ng generate interface models/user
ng generate enum models/status
```

`--standalone` is the default in Angular 17+. Use `--skip-tests` only if explicitly asked.

## Architecture

### Routes (all lazy-loaded via `loadComponent`)

| Path | Component |
|---|---|
| `/` | `DashboardComponent` |
| `/month/:year/:month` | `MonthlyViewComponent` |
| `/platform/:id` | `PlatformDetailComponent` |
| `/trends` | `TrendsComponent` |
| `/trades` | `TradeLogComponent` |
| `/entry/:platformId` | `EntryFormComponent` |

### Data Layer

- **`FinancialDataService`** (`core/services/`) is the single source of truth — all signals, no HTTP.
- Mock data in `financial-data.mock.ts`: 9 platforms, ~72 snapshots, ~21 holdings, 8 trades, ~40 expenses, 13 incomes.
- Mutations via `add*`, `update*`, `delete*` methods that `.update()` signals in-memory.
- `monthlySummary` is a `computed()` signal derived from `currentYear`/`currentMonth` signals.

### Charts

Chart.js 4.5. Charts must be created in `afterNextRender` (SSR-safe) and destroyed in `ngOnDestroy` to prevent memory leaks.

### Forms

Template-driven (`FormsModule`) with signals for state — **not** Reactive Forms.

## Key Conventions

- **`styleUrl`** (singular) in `@Component` — Angular 17+ API, not `styleUrls`.
- **No `@let`** in templates — not available until Angular 18+.
- **Tailwind utility classes only** — no custom CSS unless absolutely required.
- **No ESLint or Prettier** — formatting enforced only by `.editorconfig`.
- **Single quotes** for `.ts`, double quotes for HTML templates.
- **`inject()`** over constructor injection — never mix both in the same class.
- **New control flow** (`@if`, `@for`, `@switch`) — never `*ngIf`, `*ngFor`, `*ngSwitch`.
- **`track`** required in every `@for` loop.

## Project Structure

```
src/app/
├── core/services/      # FinancialDataService + mock data
├── features/           # One folder per lazy route (dashboard, monthly-view, etc.)
│   └── components/     # Feature-local subcomponents
├── shared/
│   ├── components/     # sidebar, header, month-picker
│   └── layouts/        # main-layout
├── models/             # Interfaces and enums (account.ts, platform.ts, etc.)
└── app.routes.ts       # All route definitions
```

- Shared components go under `shared/`, never in a feature folder.
- `.spec.ts` files co-located with their source.
