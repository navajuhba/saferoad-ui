import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Reward, Transaction } from '../../models';
import { RewardService } from '../../services/reward.service';
import { TransactionService } from '../../services/transaction.service';
import { LookupService } from '../../services/lookup.service';
import { ToasterService } from '../../services/toaster.service';
import { DataRefreshService } from '../../services/data-refresh.service';
import { SessionAuthService } from '../../services/session.service';
import { UserStateService } from '../../services/user-state.service';
import { UserService } from '../../services/user.service';

/**
 * RewardsComponent
 * User tab: own reward + transaction history.
 * Admin tab (user_type_id === 2): approve a pending reward
 * (PATCH /rewards/{id}/approve), then pay it to credit the reporter's
 * wallet (PATCH /rewards/{id}/pay?payment_method_id=).
 */
@Component({
  selector: 'app-rewards',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rewards.component.html',
  styleUrls: ['./rewards.component.scss']
})
export class RewardsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  activeTab: 'rewards' | 'transactions' | 'admin' = 'rewards';

  rewards: Reward[] = [];
  transactions: Transaction[] = [];
  isLoadingRewards = false;
  isLoadingTransactions = false;
  errorMessage: string | null = null;

  // Admin: reward approval + payout queue
  pendingRewards: Reward[] = [];
  isLoadingPendingRewards = false;
  pendingRewardsError: string | null = null;
  processingRewardId: number | null = null;
  selectedPaymentMethod: { [rewardId: number]: number } = {};

  constructor(
    private rewardService: RewardService,
    private transactionService: TransactionService,
    private lookupService: LookupService,
    private toaster: ToasterService,
    private sessionService: SessionAuthService,
    private userState: UserStateService,
    private userService: UserService,
    private dataRefresh: DataRefreshService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.ensureUserLoaded();
    this.loadData();
    this.loadPaymentMethods();
    // Only refresh the user's own history on global events — the admin queue
    // is refreshed explicitly (tab open / manual refresh) so an approve-then-pay
    // in progress here isn't clobbered by an unrelated refresh elsewhere.
    this.dataRefresh.refresh$.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadData());
  }

  /** Load current user if the signal is empty (e.g. after a page refresh) so isAdmin() is accurate. */
  private ensureUserLoaded(): void {
    const userId = this.sessionService.getUserId();
    if (!userId) return;
    if (this.userState.currentUser()) return;
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

  setTab(tab: 'rewards' | 'transactions' | 'admin'): void {
    this.activeTab = tab;
    if (tab === 'admin' && this.isAdmin() && this.pendingRewards.length === 0 && !this.isLoadingPendingRewards) {
      this.loadPendingRewards();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    const userId = this.sessionService.getUserId();
    if (!userId) {
      this.errorMessage = 'User session not found. Please login again.';
      return;
    }
    this.loadRewards(userId);
    this.loadTransactions(userId);
  }

  private loadRewards(userId: string): void {
    this.isLoadingRewards = true;
    this.rewardService.listUserRewards(userId).subscribe({
      next: (response: any) => {
        this.rewards = response?.data || (Array.isArray(response) ? response : []);
        this.isLoadingRewards = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingRewards = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadTransactions(userId: string): void {
    this.isLoadingTransactions = true;
    this.transactionService.listUserTransactions(userId).subscribe({
      next: (response: any) => {
        this.transactions = response?.data || (Array.isArray(response) ? response : []);
        this.isLoadingTransactions = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingTransactions = false;
        this.cdr.detectChanges();
      }
    });
  }


  // Fallback values matching the backend's lookups/payment-methods; overwritten once that call resolves.
  paymentMethods = [
    { id: 1, name: 'Bank Transfer' },
    { id: 2, name: 'Wallet Credit' },
    { id: 3, name: 'UPI' }
  ];

  private loadPaymentMethods(): void {
    this.lookupService.getPaymentMethods().subscribe({
      next: (response: any) => {
        const data = response?.data || (Array.isArray(response) ? response : []);
        if (data.length) {
          this.paymentMethods = data.map((m: any) => ({ id: m.payment_method_id, name: m.method_name }));
        }
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  // Matches backend lookups/reward-status: 1 pending, 2 approved, 3 paid, 4 cancelled.
  rewardStatuses = [
    { id: 1, name: 'Pending Approval', badge: 'pending' },
    { id: 2, name: 'Approved', badge: 'approved' },
    { id: 3, name: 'Paid', badge: 'completed' },
    { id: 4, name: 'Cancelled', badge: 'rejected' }
  ];

  transactionTypes = [
    { id: 1, name: 'Reward Earned', icon: '⬆️' },
    { id: 2, name: 'Redemption', icon: '⬇️' },
    { id: 3, name: 'Refund', icon: '🔄' }
  ];

  get totalEarned(): number {
    return this.rewards.reduce((sum, r) => sum + (r.reward_amount || 0), 0);
  }

  get totalPending(): number {
    return this.rewards
      .filter(r => r.reward_status_id === 1 || r.reward_status_id === 2)
      .reduce((sum, r) => sum + (r.reward_amount || 0), 0);
  }

  get totalCompleted(): number {
    return this.rewards
      .filter(r => r.reward_status_id === 3)
      .reduce((sum, r) => sum + (r.reward_amount || 0), 0);
  }

  getPaymentMethodName(methodId?: number): string {
    const method = this.paymentMethods.find(m => m.id === methodId);
    return method ? method.name : 'Unknown';
  }

  getRewardStatusBadge(statusId?: number): string {
    const status = this.rewardStatuses.find(s => s.id === statusId);
    return status ? status.badge : '';
  }

  getRewardStatusName(statusId?: number): string {
    const status = this.rewardStatuses.find(s => s.id === statusId);
    return status ? status.name : 'Unknown';
  }

  getTransactionTypeIcon(typeId?: number): string {
    const type = this.transactionTypes.find(t => t.id === typeId);
    return type ? type.icon : '📊';
  }

  getTransactionTypeName(typeId?: number): string {
    const type = this.transactionTypes.find(t => t.id === typeId);
    return type ? type.name : 'Transaction';
  }

  formatAmount(amount?: number): string {
    return '₹' + (amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  // --- Admin: reward approval + payout ---

  loadPendingRewards(): void {
    this.isLoadingPendingRewards = true;
    this.pendingRewardsError = null;
    this.rewardService.listPendingRewards().subscribe({
      next: (response: any) => {
        this.pendingRewards = response?.data || (Array.isArray(response) ? response : []);
        this.isLoadingPendingRewards = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.pendingRewardsError = (err?.status === 401 || err?.status === 403)
          ? 'You do not have permission to view reward approvals.'
          : 'Failed to load pending rewards.';
        this.isLoadingPendingRewards = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Move a reward from pending → approved (does not credit funds yet).
   * Patched in place rather than reloaded from the server, since some
   * backends drop a reward from "pending/all" the moment it's approved —
   * this keeps it on screen so the admin can immediately pay it out.
   */
  approveReward(reward: Reward): void {
    if (!this.isAdmin() || this.processingRewardId === reward.reward_id) return;
    this.processingRewardId = reward.reward_id;
    this.rewardService.approveReward(reward.reward_id).subscribe({
      next: () => {
        reward.reward_status_id = 2;
        this.processingRewardId = null;
        this.toaster.success(`Reward #${reward.reward_id} approved. Choose a payment method to credit it.`);
        this.dataRefresh.triggerRefresh();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.processingRewardId = null;
        const detail = err?.error?.detail || err?.error?.message;
        this.toaster.error(`Failed to approve reward${detail ? ': ' + detail : ''}.`);
        this.cdr.detectChanges();
      }
    });
  }

  /** Pay an approved reward — this is what actually credits the reporter's wallet. */
  payReward(reward: Reward): void {
    if (!this.isAdmin() || this.processingRewardId === reward.reward_id) return;
    const methodId = this.selectedPaymentMethod[reward.reward_id];
    if (!methodId) {
      this.toaster.warning('Select a payment method before crediting.');
      return;
    }
    this.processingRewardId = reward.reward_id;
    this.rewardService.payReward(reward.reward_id, methodId).subscribe({
      next: () => {
        this.toaster.success(`₹${reward.reward_amount} credited for reward #${reward.reward_id}.`);
        this.processingRewardId = null;
        this.pendingRewards = this.pendingRewards.filter(r => r.reward_id !== reward.reward_id);
        this.dataRefresh.triggerRefresh();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.processingRewardId = null;
        const detail = err?.error?.detail || err?.error?.message;
        this.toaster.error(`Failed to credit reward${detail ? ': ' + detail : ''}.`);
        this.cdr.detectChanges();
      }
    });
  }
}
