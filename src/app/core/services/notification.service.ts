import { Injectable, signal } from '@angular/core';

export interface AppNotification {
  id: number;
  type: 'error' | 'success' | 'info';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 0;
  readonly notifications = signal<AppNotification[]>([]);

  showError(message: string): void {
    this.add('error', message);
  }

  showSuccess(message: string): void {
    this.add('success', message);
  }

  showInfo(message: string): void {
    this.add('info', message);
  }

  dismiss(id: number): void {
    this.notifications.update(n => n.filter(item => item.id !== id));
  }

  private add(type: AppNotification['type'], message: string): void {
    const id = this.nextId++;
    this.notifications.update(n => [...n, { id, type, message }]);
    setTimeout(() => this.dismiss(id), 5000);
  }
}
