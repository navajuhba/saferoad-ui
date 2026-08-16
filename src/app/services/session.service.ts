import { Injectable } from '@angular/core';
import { EncryptionService } from './encryption.service';

/**
 * SessionAuthService
 * Manages session authentication and validation
 * Checks if user has valid encrypted session within 1-hour expiry
 */
@Injectable({
  providedIn: 'root'
})
export class SessionAuthService {

  constructor() { }

  /**
   * Check if user has valid session
   * Returns true if encrypted credentials exist and haven't expired (within 1 hour)
   */
  hasValidSession(): boolean {
    return EncryptionService.isValid('encrypted_password') && 
           EncryptionService.isValid('encrypted_email');
  }

  /**
   * Check if user is logged in (has userId in localStorage)
   */
  isLoggedIn(): boolean {
    return !!localStorage.getItem('userId') && !!localStorage.getItem('userToken');
  }

  /**
   * Get current user ID from localStorage
   */
  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  /**
   * Get auth token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('userToken');
  }

  /**
   * Logout - clear all session and auth data
   */
  logout(): void {
    localStorage.removeItem('userId');
    localStorage.removeItem('userToken');
    EncryptionService.clearSession();
  }

  /**
   * Clear all session data
   */
  clearSession(): void {
    EncryptionService.clearSession();
  }

  /**
   * Refresh session by extending expiry time
   * Called to keep user logged in when active on page
   */
  refreshSession(): void {
    const email = EncryptionService.getEncrypted('encrypted_email');
    const password = EncryptionService.getEncrypted('encrypted_password');
    
    if (email && password) {
      // Re-store with fresh 1-hour expiry
      EncryptionService.setEncrypted('encrypted_email', email, 60);
      EncryptionService.setEncrypted('encrypted_password', password, 60);
    }
  }

  /**
   * Get encrypted credentials (for testing or specific use cases)
   * Returns null if session expired
   */
  getEncryptedCredentials(): { email: string, password: string } | null {
    const email = EncryptionService.getEncrypted('encrypted_email');
    const password = EncryptionService.getEncrypted('encrypted_password');
    
    if (email && password) {
      return { email, password };
    }
    return null;
  }

  /**
   * Check if session has expired
   * Returns true if session data exists but is expired
   */
  isSessionExpired(): boolean {
    // If localStorage has userId but encrypted session is invalid, session expired
    return this.isLoggedIn() && !this.hasValidSession();
  }
}
