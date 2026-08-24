import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer } from 'rxjs';
import { take } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly http = inject(HttpClient);
  private readonly healthUrl = `${environment.apiUrl}/api/v1/health`;

  check(): Observable<unknown> {
    return this.http.get(this.healthUrl);
  }

  pollUntilHealthy(intervalMs = 2500, maxAttempts = 30): Observable<number> {
    return timer(0, intervalMs).pipe(take(maxAttempts));
  }
}
