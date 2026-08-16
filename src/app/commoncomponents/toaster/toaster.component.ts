import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToasterService, Toast } from '../../services/toaster.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toaster-container">
      <div *ngFor="let toast of toasts" 
           class="toast" 
           [class]="'toast-' + toast.type"
           [@slideIn]>
        <div class="toast-content">
          <span class="toast-icon">{{ getIcon(toast.type) }}</span>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
        <button class="toast-close" (click)="closeToast(toast.id)" type="button">×</button>
      </div>
    </div>
  `,
  styles: [`
    .toaster-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      margin-bottom: 10px;
      background: white;
      border-left: 4px solid;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 300px;
      pointer-events: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      font-size: 14px;
      line-height: 1.5;
    }

    .toast-success {
      border-left-color: #10b981;
      background: #f0fdf4;
      color: #065f46;
    }

    .toast-success .toast-icon {
      color: #10b981;
    }

    .toast-error {
      border-left-color: #ef4444;
      background: #fef2f2;
      color: #7f1d1d;
    }

    .toast-error .toast-icon {
      color: #ef4444;
    }

    .toast-info {
      border-left-color: #3b82f6;
      background: #eff6ff;
      color: #1e40af;
    }

    .toast-info .toast-icon {
      color: #3b82f6;
    }

    .toast-warning {
      border-left-color: #f59e0b;
      background: #fffbeb;
      color: #92400e;
    }

    .toast-warning .toast-icon {
      color: #f59e0b;
    }

    .toast-content {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }

    .toast-icon {
      font-size: 18px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
    }

    .toast-message {
      flex: 1;
      word-break: break-word;
    }

    .toast-close {
      background: none;
      border: none;
      color: inherit;
      opacity: 0.5;
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: opacity 0.2s ease;
    }

    .toast-close:hover {
      opacity: 0.8;
    }

    @media (max-width: 640px) {
      .toaster-container {
        right: 10px;
        left: 10px;
        top: 10px;
      }

      .toast {
        min-width: auto;
        width: auto;
      }
    }
  `],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(400px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(400px)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToasterComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private toasterService: ToasterService) {}

  ngOnInit(): void {
    this.toasterService.toasts.subscribe((toasts) => {
      this.toasts = toasts;
    });
  }

  closeToast(id: string): void {
    this.toasterService.remove(id);
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '•';
    }
  }
}
