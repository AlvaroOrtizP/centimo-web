import { Injectable, inject, signal } from '@angular/core';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { PlatformsService } from '../../api/generated/api/platforms.service';
import { AccountsService } from '../../api/generated/api/accounts.service';
import { Platform, PlatformType, Account } from '../../models';

@Injectable({ providedIn: 'root' })
export class PlatformsDataService {
  private readonly platformsApi = inject(PlatformsService);
  private readonly accountsApi = inject(AccountsService);

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

  loadAllPlatforms(): void {
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
        console.error('[PlatformsData] loadAllPlatforms error', err);
        return of([]);
      }),
    ).subscribe(platforms => {
      this.platforms.set(platforms);
    });
  }

  loadAllAccounts(): void {
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
        console.error('[PlatformsData] loadAllAccounts error', err);
        return of([]);
      }),
    ).subscribe(accounts => {
      this.accounts.set(accounts);
    });
  }
}
