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
   * POST /api/v1/verifications/approve?violation_id=&admin_id=&confidence_score=
   * The backend expects query params, not a JSON body.
   */
  approveViolation(approvalData: {
    violation_id: number | string;
    admin_id: number | string;
    confidence_score?: number;
  }): Observable<any> {
    const params = new URLSearchParams();
    params.set('violation_id', String(approvalData.violation_id));
    params.set('admin_id', String(approvalData.admin_id));
    if (approvalData.confidence_score != null) {
      params.set('confidence_score', String(approvalData.confidence_score));
    }
    return this.http.post<any>(
      `${this.apiUrl}${environment.verifications.approveViolation}?${params.toString()}`,
      {}
    );
  }

  /**
   * Reject a violation (with reason)
   * POST /api/v1/verifications/reject?violation_id=&admin_id=&rejection_reason=
   * The backend expects query params, not a JSON body.
   */
  rejectViolation(rejectionData: {
    violation_id: number | string;
    admin_id: number | string;
    rejection_reason: string;
  }): Observable<any> {
    const params = new URLSearchParams();
    params.set('violation_id', String(rejectionData.violation_id));
    params.set('admin_id', String(rejectionData.admin_id));
    params.set('rejection_reason', rejectionData.rejection_reason);
    return this.http.post<any>(
      `${this.apiUrl}${environment.verifications.rejectViolation}?${params.toString()}`,
      {}
    );
  }
}
