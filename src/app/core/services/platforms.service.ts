import { Injectable, inject, signal } from '@angular/core';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { PlatformsService } from '../../api/generated/api/platforms.service';
import { AccountsService } from '../../api/generated/api/accounts.service';
import { Platform, PlatformType, Account } from '../../models';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class PlatformsDataService {
  private readonly platformsApi = inject(PlatformsService);
  private readonly accountsApi = inject(AccountsService);
  private readonly logger = inject(LoggerService);

  private static readonly PLATFORMS_CACHE_KEY = 'centimo:platforms';
  private static readonly ACCOUNTS_CACHE_KEY = 'centimo:accounts';

  readonly platforms = signal<Platform[]>([]);
  readonly accounts = signal<Account[]>([]);

  getPlatform(id: string): Platform | undefined {
    return this.platforms().find(p => p.id === id);
  }

  getAccount(id: string): Account | undefined {
    return this.accounts().find(a => a.id === id);
  }

  getAccountsByPlatform(platformId: string): Account[] {
    return this.accounts().filter(a => a.platformId === platformId);
  }

  getAccountPlatformId(accountId: string): string {
    return this.accounts().find(a => a.id === accountId)?.platformId ?? '';
  }

  loadAllPlatforms(force = false): void {
    if (force) {
      this.clearPlatformsCache();
    } else if (this.platforms().length > 0) {
      return;
    } else {
      const cached = this.loadPlatformsCache();
      if (cached.length > 0) {
        this.platforms.set(cached);
        return;
      }
    }
    this.platformsApi.listPlatforms().pipe(
      map(list => list.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type as unknown as PlatformType,
        color: p.color,
        icon: p.icon,
        order: p.order,
        fixedNotes: p.fixedNotes ?? undefined,
      }))),
      catchError((err) => {
        this.logger.error('PlatformsData', 'loadAllPlatforms error', err);
        return of([]);
      }),
    ).subscribe(platforms => {
      this.platforms.set(platforms);
      this.savePlatformsCache(platforms);
    });
  }

  private loadPlatformsCache(): Platform[] {
    try {
      if (typeof localStorage === 'undefined') { return []; }
      const raw = localStorage.getItem(PlatformsDataService.PLATFORMS_CACHE_KEY);
      return raw ? JSON.parse(raw) as Platform[] : [];
    } catch {
      return [];
    }
  }

  private savePlatformsCache(platforms: Platform[]): void {
    try {
      if (typeof localStorage === 'undefined') { return; }
      localStorage.setItem(PlatformsDataService.PLATFORMS_CACHE_KEY, JSON.stringify(platforms));
    } catch (err) {
      this.logger.error('PlatformsData', 'savePlatformsCache error', err);
    }
  }

  private clearPlatformsCache(): void {
    try {
      if (typeof localStorage === 'undefined') { return; }
      localStorage.removeItem(PlatformsDataService.PLATFORMS_CACHE_KEY);
    } catch (err) {
      this.logger.error('PlatformsData', 'clearPlatformsCache error', err);
    }
  }

  loadAllAccounts(force = false): void {
    if (force) {
      this.clearAccountsCache();
    } else if (this.accounts().length > 0) {
      return;
    } else {
      const cached = this.loadAccountsCache();
      if (cached.length > 0) {
        this.accounts.set(cached);
        return;
      }
    }
    this.accountsApi.listAccounts().pipe(
      map(list => list.map(a => ({
        id: a.id,
        platformId: a.platformId,
        name: a.name,
        type: a.type,
        currency: a.currency,
        order: a.order,
      }))),
      catchError((err) => {
        this.logger.error('PlatformsData', 'loadAllAccounts error', err);
        return of([]);
      }),
    ).subscribe(accounts => {
      this.accounts.set(accounts);
      this.saveAccountsCache(accounts);
    });
  }

  private loadAccountsCache(): Account[] {
    try {
      if (typeof localStorage === 'undefined') { return []; }
      const raw = localStorage.getItem(PlatformsDataService.ACCOUNTS_CACHE_KEY);
      return raw ? JSON.parse(raw) as Account[] : [];
    } catch {
      return [];
    }
  }

  private saveAccountsCache(accounts: Account[]): void {
    try {
      if (typeof localStorage === 'undefined') { return; }
      localStorage.setItem(PlatformsDataService.ACCOUNTS_CACHE_KEY, JSON.stringify(accounts));
    } catch (err) {
      this.logger.error('PlatformsData', 'saveAccountsCache error', err);
    }
  }

  private clearAccountsCache(): void {
    try {
      if (typeof localStorage === 'undefined') { return; }
      localStorage.removeItem(PlatformsDataService.ACCOUNTS_CACHE_KEY);
    } catch (err) {
      this.logger.error('PlatformsData', 'clearAccountsCache error', err);
    }
  }
}
