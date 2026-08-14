import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div class="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 class="mb-1 text-center text-2xl font-semibold text-gray-900">Centimo</h1>
        <p class="mb-6 text-center text-sm text-gray-500">Accede a tu panel financiero</p>

        @if (step() === 'credentials') {
          <form (ngSubmit)="submitCredentials()">
            <label class="mb-1 block text-sm font-medium text-gray-700">Usuario</label>
            <input
              [(ngModel)]="username"
              name="username"
              required
              autocomplete="username"
              class="mb-4 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />

            <label class="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              [(ngModel)]="password"
              name="password"
              type="password"
              required
              autocomplete="current-password"
              class="mb-4 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />

            @if (error()) {
              <p class="mb-3 text-sm text-red-600">{{ error() }}</p>
            }

            <button
              type="submit"
              class="w-full rounded-xl bg-gray-900 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Entrar
            </button>
          </form>
        } @else {
          <form (ngSubmit)="submitCode()">
            <p class="mb-4 text-sm text-gray-600">
              Introduce el código de 6 dígitos de tu app de autenticación.
            </p>

            <input
              [(ngModel)]="code"
              name="code"
              inputmode="numeric"
              required
              class="mb-4 w-full rounded-xl border border-gray-300 px-3 py-2 text-center text-lg tracking-widest focus:border-gray-900 focus:outline-none"
            />

            @if (error()) {
              <p class="mb-3 text-sm text-red-600">{{ error() }}</p>
            }

            <button
              type="submit"
              class="w-full rounded-xl bg-gray-900 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Verificar
            </button>
          </form>
        }
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly step = signal<'credentials' | 'totp'>('credentials');
  readonly error = signal<string | null>(null);

  username = '';
  password = '';
  code = '';

  async submitCredentials(): Promise<void> {
    this.error.set(null);
    try {
      const result = await this.auth.login(this.username, this.password);
      if (result.requires2fa) {
        this.step.set('totp');
      } else {
        this.router.navigate(['/']);
      }
    } catch {
      this.error.set('Usuario o contraseña incorrectos');
    }
  }

  async submitCode(): Promise<void> {
    this.error.set(null);
    try {
      await this.auth.verify2fa(this.code);
      this.router.navigate(['/']);
    } catch {
      this.error.set('Código 2FA inválido');
    }
  }
}
