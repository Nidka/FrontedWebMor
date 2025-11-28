import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  public notifications$ = this.notificationSubject.asObservable();

  success(message: string, duration: number = 4000): void {
    this.show('success', message, duration);
  }

  error(message: string, duration: number = 5000): void {
    this.show('error', message, duration);
  }

  warning(message: string, duration: number = 4000): void {
    this.show('warning', message, duration);
  }

  info(message: string, duration: number = 4000): void {
    this.show('info', message, duration);
  }

  private show(type: Notification['type'], message: string, duration: number): void {
    const notification: Notification = {
      id: Math.random().toString(36).substring(7),
      type,
      message,
      duration
    };
    this.notificationSubject.next(notification);
  }
}
