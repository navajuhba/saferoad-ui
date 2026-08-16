import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Reward, Transaction } from '../../models';
import { RewardService } from '../../services/reward.service';
import { TransactionService } from '../../services/transaction.service';
import { DataRefreshService } from '../../services/data-refresh.service';
import { SessionAuthService } from '../../services/session.service';

@Component({
  selector: 'app-rewards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rewards.component.html',
  styleUrls: ['./rewards.component.scss']
})
export class RewardsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  rewards: Reward[] = [];
  transactions: Transaction[] = [];
  isLoadingRewards = false;
  isLoadingTransactions = false;
  errorMessage: string | null = null;

  constructor(
    private rewardService: RewardService,
    private transactionService: TransactionService,
    private sessionService: SessionAuthService,
    private dataRefresh: DataRefreshService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.dataRefresh.refresh$.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadData());
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


  paymentMethods = [
    { id: 1, name: 'Bank Transfer' },
    { id: 2, name: 'Digital Wallet' },
    { id: 3, name: 'Cash' }
  ];

  rewardStatuses = [
    { id: 1, name: 'Completed', badge: 'completed' },
    { id: 2, name: 'Pending', badge: 'pending' },
    { id: 3, name: 'Rejected', badge: 'rejected' }
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
      .filter(r => r.reward_status_id === 2)
      .reduce((sum, r) => sum + (r.reward_amount || 0), 0);
  }

  get totalCompleted(): number {
    return this.rewards
      .filter(r => r.reward_status_id === 1)
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
}
