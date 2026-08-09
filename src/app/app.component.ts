import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';

import { HeaderComponent } from './shared/components/header/header.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'centimo';

  private readonly swUpdate = inject(SwUpdate);

  protected readonly sidebarOpen = signal(false);
  protected readonly updateAvailable = signal(false);

  ngOnInit(): void {
    if (!this.swUpdate.isEnabled) { return; }

    this.swUpdate.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        this.updateAvailable.set(true);
      }
    });
    this.swUpdate.checkForUpdate();
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  protected async applyUpdate(): Promise<void> {
    await this.swUpdate.activateUpdate();
    location.reload();
  }
}
