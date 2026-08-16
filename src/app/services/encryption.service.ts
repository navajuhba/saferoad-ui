/**
 * Simple encryption service for localStorage
 * Uses Base64 encoding for obfuscation (not cryptographically secure)
 * For production, consider using proper encryption library
 */

export class EncryptionService {
  /**
   * Simple encryption using Base64
   * Note: This is for obfuscation only, not cryptographically secure
   */
  static encrypt(value: string): string {
    try {
      return btoa(unescape(encodeURIComponent(value)));
    } catch (error) {
      console.error('Encryption error:', error);
      return value;
    }
  }

  /**
   * Simple decryption using Base64
   */
  static decrypt(value: string): string {
    try {
      return decodeURIComponent(escape(atob(value)));
    } catch (error) {
      console.error('Decryption error:', error);
      return value;
    }
  }

  /**
   * Set encrypted value in localStorage with timestamp
   * @param key localStorage key
   * @param value value to encrypt and store
   * @param expiryMinutes expiry time in minutes (default 60 = 1 hour)
   */
  static setEncrypted(key: string, value: string, expiryMinutes: number = 60): void {
    const encrypted = this.encrypt(value);
    const timestamp = Date.now();
    const expiryTime = timestamp + expiryMinutes * 60 * 1000; // Convert to milliseconds

    const data = {
      value: encrypted,
      timestamp,
      expiry: expiryTime
    };

    localStorage.setItem(key, JSON.stringify(data));
  }

  /**
   * Get encrypted value from localStorage
   * Returns null if expired or not found
   */
  static getEncrypted(key: string): string | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const data = JSON.parse(item);
      const now = Date.now();

      // Check if data has expired
      if (data.expiry && now > data.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return this.decrypt(data.value);
    } catch (error) {
      console.error('Error retrieving encrypted data:', error);
      return null;
    }
  }

  /**
   * Check if encrypted data exists and is not expired
   */
  static isValid(key: string): boolean {
    try {
      const item = localStorage.getItem(key);
      if (!item) return false;

      const data = JSON.parse(item);
      const now = Date.now();

      return !data.expiry || now <= data.expiry;
    } catch (error) {
      return false;
    }
  }

  /**
   * Remove encrypted data from localStorage
   */
  static remove(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clear all encrypted session data
   */
  static clearSession(): void {
    EncryptionService.remove('encrypted_password');
    EncryptionService.remove('encrypted_email');
    localStorage.removeItem('userId');
    localStorage.removeItem('userToken');
    localStorage.removeItem('loginTimestamp');
  }
}
