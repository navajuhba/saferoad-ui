import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LookupService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all lookup values
   * GET /api/v1/lookups/all
   */
  getAllLookups(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${environment.lookups.getAllLookups}`
    );
  }

  /**
   * Get status values
   * GET /api/v1/lookups/status
   */
  getStatusValues(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${environment.lookups.getStatusValues}`
    );
  }

  /**
   * Get user type values
   * GET /api/v1/lookups/user-types
   */
  getUserTypes(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${environment.lookups.getUserTypes}`
    );
  }

  /**
   * Get violation status values
   * GET /api/v1/lookups/violation-status
   */
  getViolationStatuses(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${environment.lookups.getViolationStatuses}`
    );
  }

  /**
   * Get reward status values
   * GET /api/v1/lookups/reward-status
   */
  getRewardStatuses(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${environment.lookups.getRewardStatuses}`
    );
  }

  /**
   * Get transaction status values
   * GET /api/v1/lookups/transaction-status
   */
  getTransactionStatuses(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${environment.lookups.getTransactionStatuses}`
    );
  }

  /**
   * Get verification status values
   * GET /api/v1/lookups/verification-status
   */
  getVerificationStatuses(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${environment.lookups.getVerificationStatuses}`
    );
  }

  /**
   * Get verification methods
   * GET /api/v1/lookups/verification-methods
   */
  getVerificationMethods(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${environment.lookups.getVerificationMethods}`
    );
  }

  /**
   * Get vehicle types
   * GET /api/v1/lookups/vehicle-types
   */
  getVehicleTypes(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${environment.lookups.getVehicleTypes}`
    );
  }

  /**
   * Get notification types
   * GET /api/v1/lookups/notification-types
   */
  getNotificationTypes(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${environment.lookups.getNotificationTypes}`
    );
  }

  /**
   * Get payment methods
   * GET /api/v1/lookups/payment-methods
   */
  getPaymentMethods(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${environment.lookups.getPaymentMethods}`
    );
  }

  /**
   * Get transaction types
   * GET /api/v1/lookups/transaction-types
   */
  getTransactionTypes(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${environment.lookups.getTransactionTypes}`
    );
  }

  /**
   * Get license status values
   * GET /api/v1/lookups/license-status
   */
  getLicenseStatuses(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${environment.lookups.getLicenseStatuses}`
    );
  }

  /**
   * Get warning status values
   * GET /api/v1/lookups/warning-status
   */
  getWarningStatuses(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${environment.lookups.getWarningStatuses}`
    );
  }
}
