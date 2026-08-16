import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Verification, Violation } from '../../models';
import { VerificationService } from '../../services/verification.service';
import { ViolationService } from '../../services/violation.service';
import { DataRefreshService } from '../../services/data-refresh.service';
import { SessionAuthService } from '../../services/session.service';

@Component({
  selector: 'app-verifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verifications.component.html',
  styleUrls: ['./verifications.component.scss']
})
export class VerificationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  filterStatus: string = 'all';
  searchText: string = '';
  selectedVerification: Verification | null = null;
  verifications: Verification[] = [];
  violations: Violation[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  verificationStatuses = [
    { id: 1, name: 'Approved', badge: 'approved' },
    { id: 2, name: 'Pending Review', badge: 'pending' },
    { id: 3, name: 'Rejected', badge: 'rejected' }
  ];

  verificationMethods = [
    { id: 1, name: 'Traffic Camera', icon: '📷' },
    { id: 2, name: 'CCTV Footage', icon: '📹' },
    { id: 3, name: 'Ground Verification', icon: '👁️' },
    { id: 4, name: 'Police Report', icon: '🚔' },
    { id: 5, name: 'Witness Statement', icon: '👤' }
  ];

  constructor(
    private verificationService: VerificationService,
    private violationService: ViolationService,
    private sessionService: SessionAuthService,
    private dataRefresh: DataRefreshService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadVerifications();
    this.dataRefresh.refresh$.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadVerifications());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadVerifications(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.verificationService.listAllVerifications().subscribe({
      next: (response: any) => {
        const data: Verification[] = response?.data || (Array.isArray(response) ? response : []);
        this.verifications = data;
        this.violations = data.filter(v => v.violation).map(v => v.violation as Violation);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorMessage = (err?.status === 401 || err?.status === 403)
          ? 'You do not have permission to view verifications.'
          : 'Failed to load verifications. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get filteredVerifications(): Verification[] {
    return this.verifications.filter(v => {
      const matchesSearch =
        v.violation_id.toString().includes(this.searchText) ||
        this.getViolationPlate(v.violation_id)?.toLowerCase().includes(this.searchText.toLowerCase());
      const matchesStatus =
        this.filterStatus === 'all' || v.verification_status_id?.toString() === this.filterStatus;
      return matchesSearch && matchesStatus;
    });
  }

  getViolationPlate(violationId: number): string {
    const embedded = this.verifications.find(v => v.violation_id === violationId)?.violation;
    if (embedded?.vehicle_plate_number) return embedded.vehicle_plate_number;
    return this.violations.find(v => v.violation_id === violationId)?.vehicle_plate_number || 'Unknown';
  }

  getStatusBadge(statusId?: number): string {
    return this.verificationStatuses.find(s => s.id === statusId)?.badge ?? '';
  }

  getStatusName(statusId?: number): string {
    return this.verificationStatuses.find(s => s.id === statusId)?.name ?? 'Unknown';
  }

  getMethodIcon(methodId?: number): string {
    return this.verificationMethods.find(m => m.id === methodId)?.icon ?? '📊';
  }

  getMethodName(methodId?: number): string {
    return this.verificationMethods.find(m => m.id === methodId)?.name ?? 'Unknown';
  }

  getAdminName(adminId: number): string {
    return `Admin #${adminId}`;
  }

  viewDetails(verification: Verification): void {
    this.selectedVerification = verification;
  }

  closeDetails(): void {
    this.selectedVerification = null;
  }

  approveVerification(verification: Verification): void {
    this.verificationService.approveViolation({ violation_id: verification.violation_id }).subscribe({
      next: () => {
        verification.verification_status_id = 1;
        this.closeDetails();
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Approve failed:', err)
    });
  }

  rejectVerification(verification: Verification): void {
    const reason = verification.rejection_reason || 'Rejected by admin';
    this.verificationService.rejectViolation({ violation_id: verification.violation_id, rejection_reason: reason }).subscribe({
      next: () => {
        verification.verification_status_id = 3;
        this.closeDetails();
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Reject failed:', err)
    });
  }

  getStats() {
    return {
      total: this.verifications.length,
      pending: this.verifications.filter(v => v.verification_status_id === 2).length,
      approved: this.verifications.filter(v => v.verification_status_id === 1).length,
      rejected: this.verifications.filter(v => v.verification_status_id === 3).length
    };
  }
}