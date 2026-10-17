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

  /**
   * Retardo antes de mostrar el spinner. Por debajo de ~200 ms el ojo lo lee
   * como instantáneo, y un spinner que aparece y desaparece se percibe como un
   * fallo: mejor no enseñarlo si el back contesta rápido.
   */
  private static readonly SPINNER_DELAY_MS = 250;

  private readonly swUpdate = inject(SwUpdate);
  private readonly router = inject(Router);
  private readonly health = inject(HealthService);

  protected readonly backendHealthy = signal(false);
  protected readonly connectionFailed = signal(false);
  protected readonly showSpinner = signal(false);
  protected readonly sidebarOpen = signal(false);
  protected readonly updateAvailable = signal(false);
  protected readonly showShell = signal(true);

  private healthSub?: Subscription;
  private spinnerTimer?: ReturnType<typeof setTimeout>;

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
    this.clearSpinnerTimer();
    this.healthSub?.unsubscribe();

    // Si el backend ya respondió sano hace menos de 10 min, no malgastamos
    // una llamada /health: entramos directos y sin spinner.
    if (this.health.isRecentlyHealthy()) {
      this.backendHealthy.set(true);
      this.connectionFailed.set(false);
      this.showSpinner.set(false);
      return;
    }

    this.backendHealthy.set(false);
    this.connectionFailed.set(false);
    this.showSpinner.set(false);

    this.spinnerTimer = setTimeout(
      () => this.showSpinner.set(true),
      AppComponent.SPINNER_DELAY_MS,
    );

    // Sondea /health cada 2,5 s durante ~30 s. Si el back arranca (Render en
    // frío tarda 30-60 s) o el usuario pulsa "Reintentar", las peticiones que
    // estaban retenidas en el backendReadyInterceptor salen solas.
    this.healthSub = this.health
      .pollUntilHealthy()
      .pipe(
        switchMap(() => this.health.check().pipe(catchError(() => EMPTY))),
      )
      .subscribe({
        next: () => {
          this.clearSpinnerTimer();
          this.showSpinner.set(false);
          this.backendHealthy.set(true);
          this.health.markHealthy();
          this.healthSub?.unsubscribe();
        },
        complete: () => {
          // Completó sin emitir: se agotó el presupuesto sin respuesta.
          this.clearSpinnerTimer();
          this.showSpinner.set(false);
          if (!this.backendHealthy()) {
            this.connectionFailed.set(true);
          }
        },
      });
  }

  private clearSpinnerTimer(): void {
    if (this.spinnerTimer !== undefined) {
      clearTimeout(this.spinnerTimer);
      this.spinnerTimer = undefined;
    }
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
    this.clearSpinnerTimer();
    this.healthSub?.unsubscribe();
  }
}
