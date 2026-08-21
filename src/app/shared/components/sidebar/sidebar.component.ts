import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="flex h-full flex-col border-r border-gray-200 bg-white">
      <div class="flex items-center gap-3 border-b border-gray-100 px-5 py-5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm">
          C
        </div>
        <span class="text-lg font-bold tracking-tight text-gray-900">Centimo</span>
        <button
          aria-label="Cerrar menú"
          class="ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 lg:hidden"
          (click)="close.emit()"
        >
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
      </div>

      <nav aria-label="Menú principal" class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        @for (item of navItems; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-blue-50 text-blue-700 before:bg-blue-600"
            #rla="routerLinkActive"
            class="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-all duration-150 before:absolute before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-r before:transition-all hover:bg-gray-100 hover:text-gray-900"
            [class.pl-10]="compact()"
            [class.text-blue-700]="rla.isActive"
            (click)="navigate.emit()"
          >
            <span class="flex-shrink-0" [innerHTML]="item.icon"></span>
            @if (!compact()) {
              <span>{{ item.label }}</span>
            }
          </a>
        }
      </nav>

      <div class="border-t border-gray-100 px-5 py-4">
        <p class="text-xs text-gray-400">Centimo v1.0</p>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  readonly compact = input(false);
  readonly navigate = output<void>();
  readonly close = output<void>();

  protected readonly navItems: NavItem[] = [
    {
      path: '/',
      label: 'Dashboard',
      icon: `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
    },
    {
      path: '/income',
      label: 'Nómina',
      icon: `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    },
    {
      path: '/month/2026/6',
      label: 'Vista Mensual',
      icon: `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>`,
    },
    {
      path: '/trends',
      label: 'Tendencias',
      icon: `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
    },
    {
      path: '/entry/bbva',
      label: 'Entrada Datos',
      icon: `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
      // TODO: eliminar la línea verde (done) una vez entregado
      done: true,
    },
    {
      path: '/expenses',
      label: 'Gastos',
      icon: `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    },
  ];
}
