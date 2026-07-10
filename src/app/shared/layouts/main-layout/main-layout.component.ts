import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-gray-50">
      <div class="hidden w-56 flex-shrink-0 lg:block">
        <app-sidebar [compact]="false" (navigate)="closeSidebar()" />
      </div>

      @if (sidebarOpen()) {
        <div class="fixed inset-0 z-40 bg-black/50 lg:hidden" (click)="closeSidebar()"></div>
        <div class="fixed inset-y-0 left-0 z-50 w-56 lg:hidden">
          <app-sidebar [compact]="false" (navigate)="closeSidebar()" />
        </div>
      }

      <div class="flex flex-1 flex-col overflow-hidden">
        <app-header (menuClick)="toggleSidebar()" />
        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class MainLayoutComponent {
  protected readonly sidebarOpen = signal(false);

  protected toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
