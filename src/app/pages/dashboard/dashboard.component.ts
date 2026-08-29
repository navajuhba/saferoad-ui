import { Component, computed, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Violation, Reward, UserWallet } from '../../models';
import { UserStateService } from '../../services/user-state.service';
import { UserService } from '../../services/user.service';
import { ViolationService } from '../../services/violation.service';
import { RewardService } from '../../services/reward.service';
import { VerificationService } from '../../services/verification.service';
import { SessionAuthService } from '../../services/session.service';
import { DataRefreshService } from '../../services/data-refresh.service';

interface DashboardStats {
  totalReports: number;
  pendingVerification: number;
  approvedReports: number;
  totalRewards: number;
  currentBalance: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  // Loading states
  isLoadingWallet = false;
  isLoadingViolations = false;
  isLoadingRewards = false;
  
  // Error states
  walletError: string | null = null;
  violationsError: string | null = null;
  rewardsError: string | null = null;

  // Admin panel state
  isAdmin = false;
  pendingViolations: Violation[] = [];
  isLoadingPending = false;
  pendingError: string | null = null;
  approvingId: number | null = null;
  rejectingId: number | null = null;
  rejectionReasons: { [id: number]: string } = {};
  showRejectForms: { [id: number]: boolean } = {};

  vehicleTypes = [
    { id: 1, name: 'Car' }, { id: 2, name: 'Motorcycle' }, { id: 3, name: 'Truck' },
    { id: 4, name: 'Bus' }, { id: 5, name: 'Auto-rickshaw' }, { id: 6, name: 'SUV' },
    { id: 7, name: 'Sedan' }, { id: 8, name: 'Van' }, { id: 9, name: 'Others' }
  ];

  violationCategories = [
    { id: 1, name: 'Speeding' }, { id: 2, name: 'Red Light Violation' },
    { id: 3, name: 'Rash Driving' }, { id: 4, name: 'Wrong Way' },
    { id: 5, name: 'Parking Violation' }, { id: 6, name: 'No Seat Belt' },
    { id: 7, name: 'Mobile Phone Usage' }, { id: 8, name: 'Lane Change Violation' },
    { id: 9, name: 'Other' }
  ];

  getVehicleTypeName(id?: number): string {
    return this.vehicleTypes.find(t => t.id === id)?.name || 'Unknown';
  }

  getCategoryName(id?: number): string {
    return this.violationCategories.find(c => c.id === id)?.name || `Category ${id}`;
  }

  toggleRejectForm(id: number): void {
    this.showRejectForms[id] = !this.showRejectForms[id];
    if (!this.rejectionReasons[id]) this.rejectionReasons[id] = '';
  }

  constructor(
    private userStateService: UserStateService,
    private userService: UserService,
    private violationService: ViolationService,
    private rewardService: RewardService,
    private verificationService: VerificationService,
    private sessionService: SessionAuthService,
    private cdr: ChangeDetectorRef,
    private dataRefresh: DataRefreshService
  ) {}

  readonly currentUserName = computed(() => {
    const user = this.userStateService.currentUser();
    return user?.full_name || user?.username || 'Guest';
  });

  stats: DashboardStats = {
    totalReports: 0,
    pendingVerification: 0,
    approvedReports: 0,
    totalRewards: 0,
    currentBalance: 0
  };

  userWallet: UserWallet = {
    wallet_id: 0,
    user_id: 0,
    current_balance: 0,
    total_earned: 0,
    total_redeemed: 0
  };

  recentViolations: Violation[] = [];

  recentRewards: Reward[] = [];

  ngOnInit(): void {
    this.loadDashboardData();
    this.dataRefresh.refresh$.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadDashboardData());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all dashboard data from APIs
   */
  private loadDashboardData(): void {
    const user = this.userStateService.currentUser();
    const userId = user?.user_id || Number(this.sessionService.getUserId());

    if (!userId) {
      console.error('User ID not found in session');
      this.walletError = 'User session not found. Please log in again.';
      this.violationsError = 'User session not found.';
      this.rewardsError = 'User session not found.';
      this.isLoadingWallet = false;
      this.isLoadingViolations = false;
      this.isLoadingRewards = false;
      return;
    }

    // If signal is already set, use it; otherwise fetch user details to get user_type_id
    if (user) {
      this.isAdmin = user.user_type_id === 1;
      this.initDashboardLoads(userId);
    } else {
      this.userService.getUserDetails(userId.toString()).subscribe({
        next: (response: any) => {
          const userData = response?.data || response;
          if (userData) {
            this.userStateService.setUser(userData);
            this.isAdmin = userData.user_type_id === 1;
          }
          this.initDashboardLoads(userId);
          this.cdr.detectChanges();
        },
        error: () => {
          // Proceed without user details — just load data
          this.initDashboardLoads(userId);
        }
      });
    }
  }

  private initDashboardLoads(userId: number): void {
    this.loadWalletData(userId);
    this.loadRecentViolations(userId);
    this.loadRecentRewards(userId);
    this.loadPendingViolations(); // always attempt; section shows only if data returns
  }

  private loadWalletData(userId: number): void {
    this.isLoadingWallet = true;
    this.walletError = null;

    this.userService.getUserWallet(userId.toString()).subscribe(
      (response: any) => {
        const data = response?.data || response;
        if (data && data.wallet_id) {
          this.userWallet = data;
          this.stats.currentBalance = data.current_balance || 0;
        } else {
          this.walletError = 'No wallet data found.';
        }
        this.isLoadingWallet = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Failed to load wallet:', error);
        this.walletError = error?.status === 404 ? 'Wallet not found.' : 'Failed to load wallet data.';
        this.isLoadingWallet = false;
        this.cdr.detectChanges();
      }
    );
  }

  private loadRecentViolations(userId: number): void {
    this.isLoadingViolations = true;
    this.violationsError = null;

    this.violationService.listViolationsByReporter(userId.toString(), 1, 3).subscribe(
      (response: any) => {
        const data: Violation[] = response?.data || (Array.isArray(response) ? response : []);
        this.recentViolations = data;
        this.stats.totalReports = data.length;
        this.stats.pendingVerification = data.filter(v => v.violation_status_id === 1).length;
        this.stats.approvedReports = data.filter(v => v.violation_status_id === 2).length;
        this.isLoadingViolations = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Failed to load violations:', error);
        this.violationsError = 'Failed to load recent reports.';
        this.isLoadingViolations = false;
        this.cdr.detectChanges();
      }
    );
  }

  private loadRecentRewards(userId: number): void {
    this.isLoadingRewards = true;
    this.rewardsError = null;

    this.rewardService.listUserRewards(userId.toString(), 1, 2).subscribe(
      (response: any) => {
        const data: Reward[] = response?.data || (Array.isArray(response) ? response : []);
        this.recentRewards = data;
        this.stats.totalRewards = data.length;
        this.isLoadingRewards = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Failed to load rewards:', error);
        this.rewardsError = 'Failed to load recent rewards.';
        this.isLoadingRewards = false;
        this.cdr.detectChanges();
      }
    );
  }

  loadPendingViolations(): void {
    this.isLoadingPending = true;
    this.pendingError = null;

    this.violationService.listPendingViolations(1, 20).subscribe(
      (response: any) => {
        this.pendingViolations = response?.data || (Array.isArray(response) ? response : []);
        this.isAdmin = this.pendingViolations.length >= 0; // show section if API succeeded
        this.isLoadingPending = false;
        this.cdr.detectChanges();
      },
      (error) => {
        // 403/401 means not admin — silently hide the section
        if (error?.status === 401 || error?.status === 403) {
          this.isAdmin = false;
        } else {
          this.pendingError = 'Failed to load pending reports.';
        }
        this.isLoadingPending = false;
        this.cdr.detectChanges();
      }
    );
  }

  approveViolation(violationId: number): void {
    const adminId = this.sessionService.getUserId();
    if (!adminId) { console.error('No admin session'); return; }
    this.approvingId = violationId;
    this.verificationService.approveViolation({ violation_id: violationId, admin_id: adminId, confidence_score: 1 }).subscribe({
      next: () => {
        this.pendingViolations = this.pendingViolations.filter(v => v.violation_id !== violationId);
        this.approvingId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Approve failed:', err);
        this.approvingId = null;
        this.cdr.detectChanges();
      }
    });
  }

  rejectViolation(violationId: number): void {
    const reason = this.rejectionReasons[violationId] || 'Rejected by admin';
    const adminId = this.sessionService.getUserId();
    if (!adminId) { console.error('No admin session'); return; }
    this.rejectingId = violationId;
    this.verificationService.rejectViolation({ violation_id: violationId, admin_id: adminId, rejection_reason: reason }).subscribe({
      next: () => {
        this.pendingViolations = this.pendingViolations.filter(v => v.violation_id !== violationId);
        this.rejectingId = null;
        delete this.showRejectForms[violationId];
        delete this.rejectionReasons[violationId];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Reject failed:', err);
        this.rejectingId = null;
        this.cdr.detectChanges();
      }
    });
  }

  getStatColor(stat: string): string {
    const colors: { [key: string]: string } = {
      totalReports: '#1e3c72',
      pendingVerification: '#ff9500',
      approvedReports: '#2ed573',
      totalRewards: '#ee5a6f'
    };
    return colors[stat] || '#333';
  }

}
