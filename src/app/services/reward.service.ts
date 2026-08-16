import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Reward } from '../models/index';

@Injectable({
  providedIn: 'root',
})
export class RewardService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Create a new reward
   * POST /api/v1/rewards/
   */
  createReward(rewardData: any): Observable<Reward> {
    return this.http.post<Reward>(
      `${this.apiUrl}${environment.rewards.createReward}`,
      rewardData
    );
  }

  /**
   * Get reward details by ID
   * GET /api/v1/rewards/{id}
   */
  getRewardDetails(id: string): Observable<Reward> {
    return this.http.get<Reward>(
      `${this.apiUrl}${environment.rewards.getRewardDetails(id)}`
    );
  }

  /**
   * List rewards for a specific user
   * GET /api/v1/rewards/user/{id}
   */
  listUserRewards(
    userId: string,
    page?: number,
    limit?: number
  ): Observable<any> {
    let params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    const queryString = params.toString();
    const url = `${this.apiUrl}${environment.rewards.listUserRewards(userId)}${
      queryString ? '?' + queryString : ''
    }`;

    return this.http.get<any>(url);
  }

  /**
   * List all pending rewards
   * GET /api/v1/rewards/pending/all
   */
  listPendingRewards(page?: number, limit?: number): Observable<any> {
    let params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    const queryString = params.toString();
    const url = `${this.apiUrl}${environment.rewards.listPendingRewards}${
      queryString ? '?' + queryString : ''
    }`;

    return this.http.get<any>(url);
  }

  /**
   * Approve a reward
   * PATCH /api/v1/rewards/{id}/approve
   */
  approveReward(id: string, approvalData?: any): Observable<Reward> {
    return this.http.patch<Reward>(
      `${this.apiUrl}${environment.rewards.approveReward(id)}`,
      approvalData || {}
    );
  }

  /**
   * Pay a reward (mark as paid)
   * PATCH /api/v1/rewards/{id}/pay
   */
  payReward(id: string, paymentData?: any): Observable<Reward> {
    return this.http.patch<Reward>(
      `${this.apiUrl}${environment.rewards.payReward(id)}`,
      paymentData || {}
    );
  }
}
