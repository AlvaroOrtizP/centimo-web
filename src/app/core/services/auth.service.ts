import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoginResponse, TotpSetupResponse } from '../../models/auth';

const TOKEN_KEY = 'centimo_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl + '/api/v1';

  private readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly pendingPreAuth = signal<string | null>(null);

  readonly isAuthenticated = computed(() => !!this.token());

  getToken(): string | null {
    return this.token();
  }

  async login(username: string, password: string): Promise<{ requires2fa: boolean }> {
    const res = await firstValueFrom(
      this.http.post<LoginResponse>(`${this.base}/auth/login`, { username, password })
    );
    if (res.requires2fa && res.preAuthToken) {
      this.pendingPreAuth.set(res.preAuthToken);
      return { requires2fa: true };
    }
    if (res.token) {
      this.setToken(res.token);
      return { requires2fa: false };
    }
    throw new Error('Respuesta de login inválida');
  }

  async verify2fa(code: string): Promise<void> {
    const pre = this.pendingPreAuth();
    if (!pre) {
      throw new Error('No hay sesión 2FA pendiente');
    }
    const res = await firstValueFrom(
      this.http.post<LoginResponse>(`${this.base}/auth/verify-2fa`, { preAuthToken: pre, code })
    );
    if (!res.token) {
      throw new Error('Código 2FA inválido');
    }
    this.setToken(res.token);
    this.pendingPreAuth.set(null);
  }

  setup2fa(): Promise<TotpSetupResponse> {
    return firstValueFrom(this.http.post<TotpSetupResponse>(`${this.base}/auth/2fa/setup`, {}));
  }

  confirm2fa(code: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/auth/2fa/confirm`, { code }));
  }

  disable2fa(password: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/auth/2fa/disable`, { password }));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
    this.pendingPreAuth.set(null);
  }

  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.token.set(token);
  }
}
