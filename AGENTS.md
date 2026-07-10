# Centimo — Agent Guide

## Project Overview

Angular 17.3 standalone application (no NgModules) with Tailwind CSS. TypeScript 5.4, Jasmine 5.1 + Karma 6.4 for testing. No NgRx, no lazy loading yet.

## Build / Serve / Test Commands

| Command | Action |
|---|---|
| `npm start` | Dev server at `http://localhost:4200/` |
| `npm run build` | Production build to `dist/centimo` |
| `npm test` | Run all tests via Karma + Chrome |
| `ng test --watch=false` | Run all tests once (no watch) |
| `ng test --code-coverage` | Run with coverage report in `/coverage` |
| `ng build --watch --configuration development` | Dev build with watch |

### Running a Single Test

Karma has no built-in `--grep` flag. Use Jasmine focused methods:

```typescript
fdescribe('MyComponent', () => { ... });   // run only this suite
fit('should do something', () => { ... });  // run only this test
```

Or use the VS Code "ng test" launch config (`.vscode/launch.json`).

### Adding New Files

Always use Angular CLI to generate code — it enforces conventions:

```bash
ng generate component features/my-component
ng generate service core/my-service
ng generate pipe shared/my-pipe
ng generate directive shared/my-directive
ng generate guard core/auth
ng generate interceptor core/http-error
ng generate interface models/user
ng generate enum models/status
```

Use `--standalone` (default in Angular 17+). Use `--skip-tests` only if explicitly asked.

## Code Style Guidelines

### Imports

- Group: Angular core/framework imports first, then a blank line, then local relative imports.
- Use named imports (`import { Foo } from '...'`), never `import *`.
- Relative imports with `./` prefix for sibling files.
- Order alphabetically within each group.

```typescript
import { Component, input, output, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { UserService } from './user.service';
import { formatDate } from '../../shared/utils/date';
```

### Formatting

- 2-space indentation, UTF-8, LF line endings, trailing newline.
- Single quotes for TypeScript, double quotes for HTML templates.
- Semicolons required.
- Trailing whitespace trimmed.
- Max line length: soft 100, hard 120.
- One blank line between import groups and between top-level declarations.

### Naming Conventions

| Kind | Convention | Example |
|---|---|---|
| Classes, components, pipes, directives, guards | PascalCase | `export class UserProfileComponent` |
| Interfaces, types, enums | PascalCase | `interface UserConfig`, `type Status` |
| Functions, methods, properties, variables | camelCase | `getUser()`, `isLoading`, `currentUser` |
| Observables | camelCase, no trailing `$` unless stream | `user$` for async streams |
| Signals | camelCase, no prefix | `loading`, `setLoading()` |
| Files | kebab-case | `user-profile.component.ts` |
| Component selector | `app-` prefix + kebab | `selector: 'app-user-profile'` |
| Test files | `.spec.ts` suffix | `user-profile.component.spec.ts` |

### Component Architecture (Standalone)

```typescript
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-greeting',
  standalone: true,
  imports: [],
  templateUrl: './greeting.component.html',
  styleUrl: './greeting.component.css'
})
export class GreetingComponent {
  readonly name = input.required<string>();
  readonly greet = output<string>();
}
```

- Use `styleUrl` (singular, Angular 17+ API), not `styleUrls`.
- Prefer `input()`, `output()`, `signal()` over `@Input()`, `@Output()` decorators.
- Prefer `computed()` and `effect()` over manual change detection.
- Use `readonly` for inputs and outputs.
- Use `protected` for template-visible members, `private` for internal ones.

### Types & TypeScript

Strict mode is fully enabled (`tsconfig.json`). All flags are on:

- `strict: true`, `noImplicitOverride: true`, `noPropertyAccessFromIndexSignature: true`
- `noImplicitReturns: true`, `noFallthroughCasesInSwitch: true`
- `strictInjectionParameters: true`, `strictInputAccessModifiers: true`, `strictTemplates: true`
- `target: ES2022`, `module: ES2022`

Rules:

- Always annotate return types on methods.
- Prefer `interface` over `type` for object shapes.
- Use `readonly` for immutable properties.
- Avoid `any`. Use `unknown` if type is truly uncertain, then narrow.
- Use `as const` for literal constants and tuples.
- Use `Record<K, V>` over index signatures where possible.

### Error Handling

```typescript
// services
this.http.get<User>('/api/user').pipe(
  catchError((err: HttpErrorResponse) => {
    this.errorService.handle(err);
    return throwError(() => err);
  })
);

// bootstrap
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
```

- Use `catchError` with `throwError` in RxJS pipes.
- Never swallow errors in `.subscribe()` — always provide error callback or pipe through `catchError`.
- Use typed error responses (`HttpErrorResponse`) in HTTP interceptors.

### Templates

- Use new Angular control flow (`@if`, `@for`, `@switch`), never `*ngIf`, `*ngFor`, `*ngSwitch`.
- Use `track` in `@for` loops (prefer a unique id property).
- Use `as` for safe casts: `(fixture.nativeElement as HTMLElement)`.
- Use `@let` for template variables in Angular 18+ (not yet available on 17.3 — check version first).

```html
@for (user of users(); track user.id) {
  <li>{{ user.name }}</li>
} @empty {
  <li>No users found.</li>
}
```

### Services & Dependency Injection

```typescript
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly signalr = inject(SignalRService);

  readonly users = signal<User[]>([]);
}
```

- Prefer `inject()` over constructor injection. Never mix both in the same class.
- Use `providedIn: 'root'` for singletons. Use component-level providers only when scoped state is needed.
- Mark services with `@Injectable()` decorator.

### Styling

- **Tailwind CSS 3** for all styling — utility classes only. No custom CSS unless absolutely required.
- Component-specific overrides via `styleUrl` in component metadata.
- `.editorconfig` enforces: quotes single for `.ts`, double for HTML.
- Follow Tailwind conventions (mobile-first responsive, `dark:` variants, `@apply` discouraged).

### Testing (Jasmine + Karma)

```typescript
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
```

- Always use `async`/`await` with `compileComponents()`.
- Use `TestBed.configureTestingModule` with `imports` (standalone components don't need `declarations`).
- Prefer `expect().toEqual()` for deep equality, `expect().toBe()` for identity.
- Use `fixture.detectChanges()` after setting up test state.
- Use `fixture.nativeElement as HTMLElement` for DOM queries.
- Use `provideHttpClient()` / `provideRouter()` / `provideLocationMock()` in `TestBed` providers instead of importing `HttpClientTestingModule` etc.

### Project Structure

```
src/
├── app/
│   ├── core/          # Singleton services, guards, interceptors
│   ├── features/      # Feature modules, lazy-loaded routes
│   ├── shared/        # Reusable components, pipes, directives
│   ├── models/        # Interfaces, types, enums
│   └── app.config.ts
├── assets/
├── index.html
├── main.ts
└── styles.css
```

- One folder per feature, each with its own components/services.
- Shared components go under `shared/`, never in a feature folder.
- Keep `.spec.ts` files co-located with their source file.
