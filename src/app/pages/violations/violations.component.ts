import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Violation } from '../../models';
import { ViolationService, ToasterService, DataRefreshService, VerificationService } from '../../services';
import { SessionAuthService } from '../../services/session.service';
import { UserStateService } from '../../services/user-state.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-violations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './violations.component.html',
  styleUrls: ['./violations.component.scss']
})
export class ViolationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  searchText: string = '';
  filterStatus: string = 'all';
  selectedViolation: Violation | null = null;
  showForm = false;
  isLoading = true;
  violations: Violation[] = [];
  errorMessage: string | null = null;
  rejectionReason = '';
  processingId: number | null = null;

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

  violationStatuses = [
    { id: 1, name: 'Pending', badge: 'pending' },
    { id: 2, name: 'Verified', badge: 'verified' },
    { id: 3, name: 'Rejected', badge: 'rejected' }
  ];

  constructor(
    private violationService: ViolationService,
    private verificationService: VerificationService,
    private sessionService: SessionAuthService,
    private userState: UserStateService,
    private userService: UserService,
    private toasterService: ToasterService,
    private cdr: ChangeDetectorRef,
    private dataRefresh: DataRefreshService
  ) {}

  ngOnInit() {
    console.log('🟦 ViolationsComponent ngOnInit called');
    this.ensureUserLoaded();
    this.loadUserViolations();
    this.dataRefresh.refresh$.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadUserViolations());
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

  /** Admin: approve a pending violation via POST /verifications/approve. */
  approveAsAdmin(violation: Violation): void {
    if (!this.adminGuard(violation)) return;
    this.processingId = violation.violation_id;
    this.verificationService.approveViolation({
      violation_id: violation.violation_id,
      admin_id: this.sessionService.getUserId() as string,
      confidence_score: 1
    }).subscribe({
      next: () => this.afterDecision(violation, 2, 'approved'),
      error: (err: any) => this.afterDecisionError(err, 'approve')
    });
  }

  /** Admin: reject a pending violation via POST /verifications/reject. */
  rejectAsAdmin(violation: Violation): void {
    if (!this.adminGuard(violation)) return;
    const reason = (this.rejectionReason || '').trim()
      || (window.prompt('Reason for rejection:') || '').trim();
    if (!reason) {
      this.toasterService.warning('A rejection reason is required.');
      return;
    }
    this.processingId = violation.violation_id;
    this.verificationService.rejectViolation({
      violation_id: violation.violation_id,
      admin_id: this.sessionService.getUserId() as string,
      rejection_reason: reason
    }).subscribe({
      next: () => this.afterDecision(violation, 3, 'rejected'),
      error: (err: any) => this.afterDecisionError(err, 'reject')
    });
  }

  private adminGuard(violation: Violation): boolean {
    if (!this.isAdmin()) {
      this.toasterService.error('Only admins can review violations.');
      return false;
    }
    if (!this.sessionService.getUserId()) {
      this.toasterService.error('Session expired. Please log in again.');
      return false;
    }
    return this.processingId !== violation.violation_id;
  }

  private afterDecision(violation: Violation, statusId: number, outcome: string): void {
    violation.violation_status_id = statusId;
    this.processingId = null;
    this.rejectionReason = '';
    this.toasterService.success(`Violation #${violation.violation_id} ${outcome}.`);
    this.closeDetails();
    this.cdr.detectChanges();
  }

  private afterDecisionError(err: any, action: string): void {
    this.processingId = null;
    const detail = err?.error?.detail || err?.error?.message;
    this.toasterService.error(`Failed to ${action} violation${detail ? ': ' + detail : ''}.`);
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Manually refresh violations list
   */
  refreshViolations() {
    console.log('🔄 Refreshing violations...');
    this.loadUserViolations();
  }

  /**
   * Load violations reported by current user
   */
  loadUserViolations() {
    console.log('🟦 [violations] loadUserViolations START');
    this.isLoading = true;
    this.errorMessage = null;
    
    const userId = this.sessionService.getUserId();
    console.log('🟦 [violations] userId =', userId);
    
    if (!userId) {
      console.error('🟥 [violations] No userId');
      this.errorMessage = 'User session not found. Please login again.';
      this.toasterService.error('User session not found');
      this.isLoading = false;
      this.violations = [];
      return;
    }

    console.log('🟦 [violations] Calling API...');
    this.violationService.listViolationsByReporter(userId).subscribe({
      next: (response: any) => {
        try {
          console.log('🟩 [violations] API SUCCESS');
          console.log('🟩 [violations] response =', response);
          
          let violations: Violation[] = [];
          
          // Extract violations from response
          if (response?.data && Array.isArray(response.data)) {
            violations = response.data;
            console.log('🟩 [violations] Found', violations.length, 'violations in response.data');
          } else if (Array.isArray(response)) {
            violations = response;
            console.log('🟩 [violations] Found', violations.length, 'violations as direct array');
          } else {
            console.warn('🟨 [violations] Unexpected response structure');
            console.log('🟨 [violations] Response keys:', Object.keys(response || {}));
          }
          
          this.violations = violations;
          console.log('🟩 [violations] this.violations.length =', this.violations.length);
          
          if (violations.length > 0) {
            this.toasterService.success(`Loaded ${violations.length} violations`);
          } else {
            console.log('ℹ️  [violations] No violations returned');
          }
        } catch (e) {
          console.error('🟥 [violations] Exception in success handler:', e);
          this.errorMessage = 'Error processing violations data';
          this.violations = [];
        } finally {
          this.isLoading = false;
          this.cdr.detectChanges();
          console.log('🟢 [violations] isLoading = false, violations:', this.violations.length);
        }
      },
      error: (error: any) => {
        console.error('🟥 [violations] API ERROR:', error);
        console.error('🟥 [violations] error.status =', error?.status);
        
        let errorMsg = 'Failed to load violations.';
        if (error?.status === 0) {
          errorMsg = 'Network error: Unable to connect to server.';
        } else if (error?.status >= 500) {
          errorMsg = `Server error (${error?.status}): ${error?.error?.message || 'Please try again later'}`;
        } else if (error?.status >= 400) {
          errorMsg = `Error ${error?.status}: ${error?.error?.detail || error?.error?.message || 'Invalid request'}`;
        }
        
        this.errorMessage = errorMsg;
        this.toasterService.error(errorMsg);
        this.violations = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get filteredViolations(): Violation[] {
    return this.violations.filter(violation => {
      const matchesSearch =
        violation.vehicle_plate_number?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        violation.violation_id.toString().includes(this.searchText);

      const matchesStatus =
        this.filterStatus === 'all' ||
        violation.violation_status_id?.toString() === this.filterStatus;

      return matchesSearch && matchesStatus;
    });
  }

  getCategoryName(categoryId?: number): string {
    const category = this.violationCategories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  }

  getStatusBadge(statusId?: number): string {
    const status = this.violationStatuses.find(s => s.id === statusId);
    return status ? status.badge : '';
  }

  getStatusName(statusId?: number): string {
    const status = this.violationStatuses.find(s => s.id === statusId);
    return status ? status.name : 'Unknown';
  }

  viewDetails(violation: Violation) {
    this.selectedViolation = violation;
  }

  closeDetails() {
    this.selectedViolation = null;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.closest('.violation-image');
    if (parent) {
      const placeholder = parent.querySelector('.no-image-placeholder') as HTMLElement;
      if (placeholder) placeholder.style.display = 'flex';
    }
  }

  editViolation(violation: Violation) {
    console.log('Edit violation:', violation);
    // TODO: Navigate to edit page
  }

  deleteViolation(violationId: number) {
    this.violations = this.violations.filter(v => v.violation_id !== violationId);
    this.closeDetails();
  }

  getStats() {
    return {
      total: this.violations.length,
      pending: this.violations.filter(v => v.violation_status_id === 1).length,
      verified: this.violations.filter(v => v.violation_status_id === 2).length
    };
  }
}
