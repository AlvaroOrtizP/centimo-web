import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly isProd = false;

  log(context: string, ...args: unknown[]): void {
    if (!this.isProd) {
      console.log(`[${context}]`, ...args);
    }
  }

  error(context: string, ...args: unknown[]): void {
    console.error(`[${context}]`, ...args);
  }

  warn(context: string, ...args: unknown[]): void {
    if (!this.isProd) {
      console.warn(`[${context}]`, ...args);
    }
  }
}
