import { Component, input, signal, effect, OnInit } from '@angular/core';

@Component({
  selector: 'app-collapsible-description',
  standalone: true,
  template: `
    <div class="rounded-xl border border-gray-200/80 bg-gray-50/60 px-4 py-3">
      <div class="flex items-center justify-between gap-3">
        @if (!collapsed()) {
          <p class="text-sm text-gray-600">{{ description() }}</p>
        } @else {
          <span aria-hidden="true"></span>
        }
        <button
          (click)="toggle()"
          class="flex-shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-200/60 hover:text-gray-600"
          [attr.aria-label]="collapsed() ? 'Mostrar descripción' : 'Ocultar descripción'"
        >
          @if (collapsed()) {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          }
        </button>
      </div>
    </div>
  `,
})
export class CollapsibleDescriptionComponent implements OnInit {
  readonly description = input.required<string>();
  readonly storageKey = input<string>('description');

  protected readonly collapsed = signal(false);

  constructor() {
    effect(() => {
      localStorage.setItem(this.storageKey(), String(this.collapsed()));
    });
  }

  ngOnInit(): void {
    this.collapsed.set(localStorage.getItem(this.storageKey()) === 'true');
  }

  protected toggle(): void {
    this.collapsed.update(v => !v);
  }
}
