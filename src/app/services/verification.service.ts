import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Verification } from '../models/index';

@Injectable({
  providedIn: 'root',
})
export class VerificationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * List all verifications (admin)
   * GET /api/v1/verifications/
   */
  listAllVerifications(page?: number, limit?: number): Observable<any> {
    let params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const qs = params.toString();
    const url = `${this.apiUrl}${environment.verifications.listAllVerifications}${qs ? '?' + qs : ''}`;
    return this.http.get<any>(url);
  }

  /**
   * Create a new verification record
   * POST /api/v1/verifications/
   */
  createVerification(verificationData: any): Observable<Verification> {
    return this.http.post<Verification>(
      `${this.apiUrl}${environment.verifications.createVerification}`,
      verificationData
    );
  }

  /**
   * Approve a violation (with verification)
   * POST /api/v1/verifications/approve
   */
  approveViolation(approvalData: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}${environment.verifications.approveViolation}`,
      approvalData
    );
  }

  /**
   * Reject a violation (with reason)
   * POST /api/v1/verifications/reject
   */
  rejectViolation(rejectionData: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}${environment.verifications.rejectViolation}`,
      rejectionData
    );
  }
}
