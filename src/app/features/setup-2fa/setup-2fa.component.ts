import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { TotpSetupResponse } from '../../models/auth';

@Component({
  selector: 'app-setup-2fa',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-sm">
      <h2 class="mb-4 text-xl font-semibold text-gray-900">Autenticación de dos factores</h2>

      @if (message()) {
        <p class="mb-4 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">{{ message() }}</p>
      }
      @if (error()) {
        <p class="mb-4 text-sm text-red-600">{{ error() }}</p>
      }

      @if (!setup()) {
        <button
          (click)="start()"
          class="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Activar 2FA
        </button>
      } @else {
        <div class="space-y-4">
          <p class="text-sm text-gray-600">
            Añade la cuenta a tu app autenticadora (Google Authenticator, Authy...) usando
            el secreto o esta URL:
          </p>

          <div>
            <p class="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Secreto</p>
            <code class="block break-all rounded-lg bg-gray-100 px-3 py-2 text-sm">{{ setup()?.secret }}</code>
          </div>

          <div>
            <p class="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">URL otpauth</p>
            <code class="block break-all rounded-lg bg-gray-100 px-3 py-2 text-sm">{{ setup()?.otpauthUrl }}</code>
          </div>

          <div>
            <p class="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
              Códigos de recuperación (guárdalos en un sitio seguro)
            </p>
            <ul class="space-y-1">
              @for (c of setup()?.backupCodes ?? []; track c) {
                <li class="rounded-lg bg-gray-100 px-3 py-1 font-mono text-sm">{{ c }}</li>
              }
            </ul>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Código de confirmación</label>
            <input
              [(ngModel)]="code"
              name="code"
              inputmode="numeric"
              class="mb-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-center text-lg tracking-widest focus:border-gray-900 focus:outline-none"
            />
            <button
              (click)="confirm()"
              class="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Confirmar y activar
            </button>
          </div>
        </div>
      }

      <hr class="my-6 border-gray-200" />

      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">Desactivar 2FA (introduce tu contraseña)</label>
        <div class="flex gap-2">
          <input
            [(ngModel)]="password"
            name="password"
            type="password"
            class="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
          <button
            (click)="disable()"
            class="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Desactivar
          </button>
        </div>
      </div>
    </div>
  `,
})
export class Setup2faComponent {
  private readonly auth = inject(AuthService);

  readonly setup = signal<TotpSetupResponse | null>(null);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  code = '';
  password = '';

  async start(): Promise<void> {
    this.error.set(null);
    this.message.set(null);
    try {
      this.setup.set(await this.auth.setup2fa());
    } catch {
      this.error.set('No se pudo iniciar la configuración 2FA');
    }
  }

  async confirm(): Promise<void> {
    this.error.set(null);
    try {
      await this.auth.confirm2fa(this.code);
      this.message.set('2FA activado correctamente');
      this.setup.set(null);
    } catch {
      this.error.set('Código inválido');
    }
  }

  async disable(): Promise<void> {
    this.error.set(null);
    try {
      await this.auth.disable2fa(this.password);
      this.message.set('2FA desactivado');
      this.password = '';
    } catch {
      this.error.set('Contraseña incorrecta');
    }
  }
}
