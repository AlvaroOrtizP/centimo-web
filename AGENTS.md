# Centimo — Agent Guide

## Project Overview

Angular 17.3 standalone application (no NgModules) with Tailwind CSS. TypeScript 5.4, Jasmine 5.1 + Karma 6.4 for testing. No NgRx.

Personal finance dashboard — **backend Java en `http://localhost:8080`**. API generada desde OpenAPI spec (`docs/swagger.yaml`). Datos iniciales cargados vía HTTP al navegar a la ruta raíz (resolver).

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

### Routes (all lazy-loaded via `loadComponent` + barrel exports)

| Path | Component |
|---|---|
| `/` | `DashboardComponent` |
| `/income` | `IncomeComponent` |
| `/month/:year/:month` | `MonthlyViewComponent` |
| `/platform/:id` | `PlatformDetailComponent` |
| `/trends` | `TrendsComponent` |
| `/trades` | `TradeLogComponent` |
| `/entry/:platformId` | `EntryFormComponent` |

### Data Layer

- **API generada** en `api/generated/` desde OpenAPI spec. 15 servicios HTTP (Accounts, Alerts, Commitments, Crowdlending, Expenses, etc.).
- **`FinancialDataService`** (`core/services/`) — fachada que delega en sub-servicios (`PlatformsDataService`, `SnapshotsDataService`, `ExpensesDataService`, etc.).
- **Carga inicial:** `initDataResolver` en ruta raíz carga platforms, accounts, snapshots y 6 meses de summaries al navegar.
- **Sub-servicios con HTTP:** platforms, snapshots, expenses, incomes, summary.
- **Sub-servicios solo locales (sin backend aún):** salary, investments.
- **Mutaciones:** `add*`, `update*`, `delete*` — algunas van al backend, otras solo actualizan signals en memoria.
- **Cache:** `SummaryDataService` usa `signal<Map>` como cache de monthly summaries.

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
├── core/services/      # FinancialDataService + sub-services (fachada)
├── core/resolvers/     # initDataResolver (lazy loading)
├── core/interceptors/  # errorInterceptor
├── core/constants/     # platform, date, trade constants
├── api/generated/      # OpenAPI-generated services (15 HTTP clients)
├── features/           # One folder per lazy route (dashboard, monthly-view, etc.)
│   ├── index.ts        # Barrel export por feature
│   └── components/     # Feature-local subcomponents
├── shared/
│   ├── components/     # sidebar, header, month-picker, base-chart
│   ├── layouts/        # main-layout
│   └── pipes/          # currencyEUR pipe
├── models/             # Interfaces and enums (account.ts, platform.ts, etc.)
│   └── index.ts        # Barrel export
└── app.routes.ts       # All route definitions (barrel imports)
```

- Shared components go under `shared/`, never in a feature folder.
- `.spec.ts` files co-located with their source.
