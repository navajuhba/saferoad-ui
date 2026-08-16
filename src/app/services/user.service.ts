import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, UserWallet, ApiResponse } from '../models/index';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Register a new user
   * POST /api/v1/users/register
   */
  register(userData: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}${environment.users.register}`,
      userData
    );
  }

  /**
   * User login
   * POST /api/v1/users/login
   */
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}${environment.users.login}`,
      credentials
    );
  }

  /**
   * Get user details
   * GET /api/v1/users/{user_id}
   * Response: { status: "success", message: string, data: User, errors: null }
   */
  getUserDetails(userId: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(
      `${this.apiUrl}${environment.users.getUserDetails(userId)}`
    );
  }

  /**
   * Get user wallet
   * GET /api/v1/users/{user_id}/wallet
   * Response: { status: "success", message: string, data: UserWallet, errors: null }
   */
  getUserWallet(userId: string): Observable<ApiResponse<UserWallet>> {
    return this.http.get<ApiResponse<UserWallet>>(
      `${this.apiUrl}${environment.users.getUserWallet(userId)}`
    );
  }

  /**
   * List all users (admin)
   * GET /api/v1/users/?skip=0&limit=100
   */
  listAllUsers(skip = 0, limit = 100): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${environment.users.listAllUsers}?skip=${skip}&limit=${limit}`
    );
  }

  /**
   * Update a user
   * PUT /api/v1/users/{user_id}
   */
  updateUser(userId: string, userData: any): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}${environment.users.updateUser(userId)}`,
      userData
    );
  }

  /**
   * Delete a user
   * DELETE /api/v1/users/{user_id}
   */
  deleteUser(userId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}${environment.users.deleteUser(userId)}`
    );
  }
}
