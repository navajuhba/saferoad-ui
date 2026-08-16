import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToasterService {
  private toasts$ = new BehaviorSubject<Toast[]>([]);
  public toasts: Observable<Toast[]> = this.toasts$.asObservable();

  constructor() {}

  /**
   * Show success toast notification
   */
  success(message: string, duration: number = 3000): void {
    this.show(message, 'success', duration);
  }

  /**
   * Show error toast notification
   */
  error(message: string, duration: number = 5000): void {
    this.show(message, 'error', duration);
  }

  /**
   * Show info toast notification
   */
  info(message: string, duration: number = 3000): void {
    this.show(message, 'info', duration);
  }

  /**
   * Show warning toast notification
   */
  warning(message: string, duration: number = 4000): void {
    this.show(message, 'warning', duration);
  }

  /**
   * Show a toast notification
   */
  private show(message: string, type: 'success' | 'error' | 'info' | 'warning', duration: number): void {
    const id = this.generateId();
    const toast: Toast = { id, message, type, duration };

    // Add new toast to the list
    const currentToasts = this.toasts$.value;
    this.toasts$.next([...currentToasts, toast]);

    // Auto-remove after specified duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  /**
   * Remove a toast by ID
   */
  remove(id: string): void {
    const currentToasts = this.toasts$.value;
    this.toasts$.next(currentToasts.filter(t => t.id !== id));
  }

  /**
   * Clear all toasts
   */
  clearAll(): void {
    this.toasts$.next([]);
  }

  /**
   * Generate unique ID for toast
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
