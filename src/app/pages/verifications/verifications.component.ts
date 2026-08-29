import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Violation } from '../../models';
import { VerificationService } from '../../services/verification.service';
import { ViolationService } from '../../services/violation.service';
import { DataRefreshService, ToasterService } from '../../services';
import { SessionAuthService } from '../../services/session.service';
import { UserStateService } from '../../services/user-state.service';
import { UserService } from '../../services/user.service';

/**
 * VerificationsComponent
 * Admin review queue: lists pending violations (GET /api/v1/violations/pending/list)
 * and lets an admin (user_type_id === 2) approve or reject each one via
 * POST /api/v1/verifications/approve|reject.
 */
@Component({
  selector: 'app-verifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verifications.component.html',
  styleUrls: ['./verifications.component.scss']
})
export class VerificationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  searchText = '';
  selectedViolation: Violation | null = null;
  rejectionReason = '';
  pendingViolations: Violation[] = [];
  isLoading = false;
  processingId: number | null = null;
  errorMessage: string | null = null;

  violationCategories = [
    { id: 1, name: 'Speeding' },
    { id: 2, name: 'Red Light Violation' },
    { id: 3, name: 'Rash Driving' },
    { id: 4, name: 'Wrong Way' },
    { id: 5, name: 'Parking Violation' },
    { id: 6, name: 'No Seat Belt' },
    { id: 7, name: 'Mobile Phone Usage' },
    { id: 8, name: 'Lane Change Violation' },
    { id: 9, name: 'Other' }
  ];

  constructor(
    private verificationService: VerificationService,
    private violationService: ViolationService,
    private sessionService: SessionAuthService,
    private userState: UserStateService,
    private userService: UserService,
    private toaster: ToasterService,
    private dataRefresh: DataRefreshService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.ensureUserLoaded();
    this.loadPending();
    this.dataRefresh.refresh$.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadPending());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Load current user if the signal is empty (e.g. after a page refresh) so isAdmin() is accurate. */
  private ensureUserLoaded(): void {
    if (this.userState.currentUser()) return;
    const userId = this.sessionService.getUserId();
    if (!userId) return;
    this.userService.getUserDetails(userId).subscribe({
      next: (response: any) => {
        const user = response?.data || response;
        if (user?.user_id) {
          this.userState.setUser(user);
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  isAdmin(): boolean {
    return this.userState.currentUser()?.user_type_id === 2;
  }

  private currentAdminId(): string | null {
    return this.sessionService.getUserId();
  }

  loadPending(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.violationService.listPendingViolations().subscribe({
      next: (response: any) => {
        const data: Violation[] = response?.data || (Array.isArray(response) ? response : []);
        this.pendingViolations = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorMessage = (err?.status === 401 || err?.status === 403)
          ? 'You do not have permission to view the review queue.'
          : 'Failed to load pending violations. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get filteredViolations(): Violation[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return this.pendingViolations;
    return this.pendingViolations.filter(v =>
      v.violation_id.toString().includes(q) ||
      (v.vehicle_plate_number || '').toLowerCase().includes(q)
    );
  }

  getCategoryName(categoryId?: number): string {
    return this.violationCategories.find(c => c.id === categoryId)?.name ?? 'Unknown';
  }

  viewDetails(violation: Violation): void {
    this.selectedViolation = violation;
    this.rejectionReason = '';
  }

  closeDetails(): void {
    this.selectedViolation = null;
    this.rejectionReason = '';
  }

  approve(violation: Violation): void {
    if (!this.guard(violation)) return;
    this.processingId = violation.violation_id;
    this.verificationService.approveViolation({
      violation_id: violation.violation_id,
      admin_id: this.currentAdminId() as string,
      confidence_score: 1
    }).subscribe({
      next: () => this.onDecision(violation, 'approved'),
      error: (err: any) => this.onDecisionError(err, 'approve')
    });
  }

  reject(violation: Violation, reason?: string): void {
    if (!this.guard(violation)) return;
    const finalReason = (reason ?? this.rejectionReason ?? '').trim()
      || (window.prompt('Reason for rejection:') || '').trim();
    if (!finalReason) {
      this.toaster.warning('A rejection reason is required.');
      return;
    }
    this.processingId = violation.violation_id;
    this.verificationService.rejectViolation({
      violation_id: violation.violation_id,
      admin_id: this.currentAdminId() as string,
      rejection_reason: finalReason
    }).subscribe({
      next: () => this.onDecision(violation, 'rejected'),
      error: (err: any) => this.onDecisionError(err, 'reject')
    });
  }

  private guard(violation: Violation): boolean {
    if (!this.isAdmin()) {
      this.toaster.error('Only admins can review violations.');
      return false;
    }
    if (!this.currentAdminId()) {
      this.toaster.error('Session expired. Please log in again.');
      return false;
    }
    if (this.processingId === violation.violation_id) return false;
    return true;
  }

  private onDecision(violation: Violation, outcome: 'approved' | 'rejected'): void {
    this.pendingViolations = this.pendingViolations.filter(v => v.violation_id !== violation.violation_id);
    this.processingId = null;
    this.toaster.success(`Violation #${violation.violation_id} ${outcome}.`);
    if (this.selectedViolation?.violation_id === violation.violation_id) this.closeDetails();
    this.cdr.detectChanges();
  }

  private onDecisionError(err: any, action: string): void {
    this.processingId = null;
    const detail = err?.error?.detail || err?.error?.message;
    this.toaster.error(`Failed to ${action} violation${detail ? ': ' + detail : ''}.`);
    this.cdr.detectChanges();
  }

  getStats() {
    return { pending: this.pendingViolations.length };
  }
}
