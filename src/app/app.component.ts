import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { Subscription, catchError, filter, switchMap, EMPTY } from 'rxjs';

import { HeaderComponent } from './shared/components/header/header.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { AuthService } from './core/services/auth.service';
import { HealthService } from './core/services/health.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'centimo';

  private readonly swUpdate = inject(SwUpdate);
  private readonly router = inject(Router);
  private readonly health = inject(HealthService);

  protected readonly backendHealthy = signal(false);
  protected readonly connectionFailed = signal(false);
  protected readonly sidebarOpen = signal(false);
  protected readonly updateAvailable = signal(false);
  protected readonly showShell = signal(true);

  private healthSub?: Subscription;

  ngOnInit(): void {
    this.startHealthCheck();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = (event as NavigationEnd).urlAfterRedirects;
        this.showShell.set(!url.startsWith('/login'));
      });

    if (!this.swUpdate.isEnabled) { return; }

    this.swUpdate.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        this.updateAvailable.set(true);
      }
    });
    this.swUpdate.checkForUpdate();
  }

  protected retry(): void {
    this.startHealthCheck();
  }

  private startHealthCheck(): void {
    this.backendHealthy.set(false);
    this.connectionFailed.set(false);
    this.healthSub?.unsubscribe();

    this.healthSub = this.health
      .pollUntilHealthy(2500, 30)
      .pipe(
        switchMap(() => this.health.check().pipe(catchError(() => EMPTY))),
      )
      .subscribe({
        next: () => {
          this.backendHealthy.set(true);
          this.healthSub?.unsubscribe();
        },
        complete: () => {
          if (!this.backendHealthy()) {
            this.connectionFailed.set(true);
          }
        },
      });
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

  ngOnDestroy(): void {
    this.healthSub?.unsubscribe();
  }
}
