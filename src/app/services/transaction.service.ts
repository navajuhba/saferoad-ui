import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Transaction } from '../models/index';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get transaction details by ID
   * GET /api/v1/transactions/{id}
   */
  getTransactionDetails(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(
      `${this.apiUrl}${environment.transactions.getTransactionDetails(id)}`
    );
  }

  /**
   * List all transactions for a specific user
   * GET /api/v1/transactions/user/{id}
   */
  listUserTransactions(
    userId: string,
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
    const url = `${this.apiUrl}${environment.transactions.listUserTransactions(userId)}${
      queryString ? '?' + queryString : ''
    }`;

    return this.http.get<any>(url);
  }
}
