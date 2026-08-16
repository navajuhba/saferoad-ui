import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Violation, ViolationCategory } from '../models/index';

@Injectable({
  providedIn: 'root',
})
export class ViolationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Report a new violation
   * POST /api/v1/violations/
   */
  reportViolation(violationData: any): Observable<Violation> {
    return this.http.post<Violation>(
      `${this.apiUrl}${environment.violations.reportViolation}`,
      violationData
    );
  }

  /**
   * Get violation details by ID
   * GET /api/v1/violations/{id}
   */
  getViolationDetails(id: string): Observable<Violation> {
    return this.http.get<Violation>(
      `${this.apiUrl}${environment.violations.getViolationDetails(id)}`
    );
  }

  /**
   * List all violations
   * GET /api/v1/violations/
   */
  listAllViolations(
    page?: number,
    limit?: number,
    filters?: any
  ): Observable<any> {
    let params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params.append(key, filters[key]);
      });
    }

    const queryString = params.toString();
    const url = `${this.apiUrl}${environment.violations.listAllViolations}${
      queryString ? '?' + queryString : ''
    }`;

    return this.http.get<any>(url);
  }

  /**
   * List pending violations
   * GET /api/v1/violations/pending/list
   */
  listPendingViolations(page?: number, limit?: number): Observable<any> {
    let params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    const queryString = params.toString();
    const url = `${this.apiUrl}${environment.violations.listPendingViolations}${
      queryString ? '?' + queryString : ''
    }`;

    return this.http.get<any>(url);
  }

  /**
   * List violations by reporter (user)
   * GET /api/v1/violations/reporter/{id}
   */
  listViolationsByReporter(
    userId: string,
    page?: number,
    limit?: number
  ): Observable<any> {
    let params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    const queryString = params.toString();
    const url = `${this.apiUrl}${environment.violations.listViolationsByReporter(userId)}${
      queryString ? '?' + queryString : ''
    }`;

    return this.http.get<any>(url);
  }

  /**
   * Create a violation category
   * POST /api/v1/violations/categories/
   */
  createViolationCategory(categoryData: any): Observable<ViolationCategory> {
    return this.http.post<ViolationCategory>(
      `${this.apiUrl}${environment.violations.createViolationCategory}`,
      categoryData
    );
  }

  /**
   * List all violation categories
   * GET /api/v1/violations/categories/
   */
  listViolationCategories(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${environment.violations.listViolationCategories}`
    );
  }
}
