import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Violation, ViolationCategory } from '../../models';
import { VerificationService } from '../../services/verification.service';
import { ViolationService } from '../../services/violation.service';
import { RewardService } from '../../services/reward.service';
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
  rewardAmount: number | null = null;
  pendingViolations: Violation[] = [];
  violationCategories: ViolationCategory[] = [];
  isLoading = false;
  processingId: number | null = null;
  errorMessage: string | null = null;

  constructor(
    private verificationService: VerificationService,
    private violationService: ViolationService,
    private rewardService: RewardService,
    private sessionService: SessionAuthService,
    private userState: UserStateService,
    private userService: UserService,
    private toaster: ToasterService,
    private dataRefresh: DataRefreshService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.ensureUserLoaded();
    this.loadCategories();
    this.loadPending();
    this.dataRefresh.refresh$.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadPending());
  }

  private loadCategories(): void {
    this.violationService.listViolationCategories().subscribe({
      next: (response: any) => {
        this.violationCategories = response?.data || (Array.isArray(response) ? response : []);
      },
      error: () => {}
    });
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
    this.userService.getUserDetailsWithType(userId).subscribe({
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
    return this.violationCategories.find(c => c.category_id === categoryId)?.category_name ?? 'Unknown';
  }

  getCategoryBaseAmount(categoryId?: number): number {
    return this.violationCategories.find(c => c.category_id === categoryId)?.base_reward_amount ?? 0;
  }

  viewDetails(violation: Violation): void {
    this.selectedViolation = violation;
    this.rejectionReason = '';
    this.rewardAmount = this.getCategoryBaseAmount(violation.category_id);
  }

  closeDetails(): void {
    this.selectedViolation = null;
    this.rejectionReason = '';
  }

  /**
   * Approve the violation, then credit the reporter by creating a reward
   * (POST /rewards/) for the category's base amount, or `amount` if given
   * (used by the modal's editable reward-amount field).
   */
  approve(violation: Violation, amount?: number): void {
    if (!this.guard(violation)) return;
    const rewardAmount = amount ?? this.getCategoryBaseAmount(violation.category_id);
    this.processingId = violation.violation_id;
    this.verificationService.approveViolation({
      violation_id: violation.violation_id,
      admin_id: this.currentAdminId() as string,
      confidence_score: 1
    }).subscribe({
      next: () => this.creditReward(violation, rewardAmount),
      error: (err: any) => this.onDecisionError(err, 'approve')
    });
  }

  private creditReward(violation: Violation, amount: number): void {
    this.rewardService.createReward({
      violation_id: violation.violation_id,
      reporter_id: violation.reporter_id,
      category_id: violation.category_id,
      reward_amount: amount
    }).subscribe({
      next: () => {
        this.onDecision(violation, 'approved', `Violation #${violation.violation_id} approved — ₹${amount} reward credited to reporter #${violation.reporter_id}.`);
      },
      error: (err: any) => {
        // Violation is already approved server-side; only the reward creation failed.
        const detail = err?.error?.detail || err?.error?.message;
        this.onDecision(violation, 'approved', `Violation #${violation.violation_id} approved, but reward creation failed${detail ? ': ' + detail : ''}.`);
      }
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

  private onDecision(violation: Violation, outcome: 'approved' | 'rejected', message?: string): void {
    this.pendingViolations = this.pendingViolations.filter(v => v.violation_id !== violation.violation_id);
    this.processingId = null;
    this.toaster.success(message ?? `Violation #${violation.violation_id} ${outcome}.`);
    if (this.selectedViolation?.violation_id === violation.violation_id) this.closeDetails();
    this.dataRefresh.triggerRefresh();
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
