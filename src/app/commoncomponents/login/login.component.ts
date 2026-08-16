import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { EncryptionService } from '../../services/encryption.service';
import { ApiResponse } from '../../models/index';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if user has valid session (encrypted credentials within 1 hour)
    if (EncryptionService.isValid('encrypted_password')) {
      const email = EncryptionService.getEncrypted('encrypted_email');
      const password = EncryptionService.getEncrypted('encrypted_password');
      
      if (email && password) {
        this.isLoading.set(true);
        this.userService.login({ email, password }).subscribe({
          next: (response: ApiResponse<any>) => {
            if (response.status === 'success') {
              // Update stored credentials for fresh 1-hour expiry
              EncryptionService.setEncrypted('encrypted_password', password, 60);
              EncryptionService.setEncrypted('encrypted_email', email, 60);
              
              // Store userId and token
              localStorage.setItem('userId', response.data.user_id.toString());
              localStorage.setItem('token', response.data.token || '');
              
              // Navigate to dashboard (auto-login successful)
              this.router.navigate(['/dashboard']);
            } else {
              this.initializeForm();
            }
            this.isLoading.set(false);
          },
          error: () => {
            // Session auto-login failed - show login form
            this.initializeForm();
            this.isLoading.set(false);
          }
        });
        return;
      }
    }
    
    // No valid session - show login form normally
    this.initializeForm();
  }

  /**
   * Initialize login form with validation
   */
  initializeForm() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Handle login submission
   */
  onLogin() {
    if (this.loginForm.invalid) {
      this.errorMessage.set('Please fill in all required fields correctly');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const credentials = {
      email: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value
    };

    this.userService.login(credentials).subscribe({
      next: (response: ApiResponse<any>) => {
        if (response.status === 'success' && response.data) {
          this.successMessage.set('Login successful! Redirecting...');
          
          // Store user ID and token in localStorage
          localStorage.setItem('userId', response.data.user_id || '');
          localStorage.setItem('userToken', response.data.token || '');
          
          // Store encrypted credentials with 1-hour expiry for session persistence
          const email = credentials.email;
          const password = credentials.password;
          EncryptionService.setEncrypted('encrypted_email', email, 60);
          EncryptionService.setEncrypted('encrypted_password', password, 60);
          
          // Navigate to dashboard after short delay
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 500);
        } else {
          this.errorMessage.set(response.message || 'Login failed');
        }
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Login error:', error);
        
        // Extract the exact error message from various possible error structures
        let errorMessage = 'Login failed. Please try again.';
        
        if (error?.error?.detail) {
          // FastAPI error format: {detail: 'message'}
          errorMessage = error.error.detail;
        } else if (error?.error?.message) {
          // Standard API error format: {message: 'message'}
          errorMessage = error.error.message;
        } else if (error?.message) {
          // HttpErrorResponse message
          errorMessage = error.message;
        }
        
        this.errorMessage.set(errorMessage);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Navigate to register page
   */
  goToRegister() {
    this.router.navigate(['/register']);
  }

  /**
   * Get form control for easy access in template
   */
  get f() {
    return this.loginForm.controls;
  }
}
