import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { LookupService } from '../../services/lookup.service';
import { ApiResponse } from '../../models/index';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = signal(false);
  isLoadingUserTypes = signal(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // User types fetched from API
  userTypes = signal<any[]>([]);

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private lookupService: LookupService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.loadUserTypes();
  }

  /**
   * Load user types from API
   */
  loadUserTypes() {
    this.isLoadingUserTypes.set(true);

    this.lookupService.getUserTypes().subscribe({
      next: (response: ApiResponse<any[]>) => {
        if (response.data && Array.isArray(response.data)) {
          this.userTypes.set(response.data);
          // Set first user type as default
          if (response.data.length > 0) {
            this.registerForm.patchValue({
              user_type_id: response.data[0].user_type_id
            });
          }
        }
        this.isLoadingUserTypes.set(false);
      },
      error: (error) => {
        console.error('Error loading user types:', error);
        // Set default user types if API fails
        this.userTypes.set([
          { user_type_id: 1, type_name: 'Reporter' },
          { user_type_id: 2, type_name: 'Admin' },
          { user_type_id: 3, type_name: 'Violator' }
        ]);
        this.isLoadingUserTypes.set(false);
      }
    });
  }

  /**
   * Initialize registration form with validation
   */
  initializeForm() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      full_name: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      user_type_id: [1, Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Custom validator to check if passwords match
   */
  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirm_password')?.value;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  /**
   * Handle registration submission
   */
  onRegister() {
    if (this.registerForm.invalid) {
      this.errorMessage.set('Please fill in all required fields correctly');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Prepare data for API (exclude confirm_password)
    const registrationData = {
      email: this.registerForm.get('email')?.value,
      username: this.registerForm.get('username')?.value,
      full_name: this.registerForm.get('full_name')?.value,
      password: this.registerForm.get('password')?.value,
      phone: this.registerForm.get('phone')?.value,
      user_type_id: this.registerForm.get('user_type_id')?.value
    };

    this.userService.register(registrationData).subscribe({
      next: (response: ApiResponse<any>) => {
        if (response.status === 'success') {
          this.successMessage.set('Registration successful! Redirecting to login...');
          
          // Navigate to login after short delay
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
        } else {
          this.errorMessage.set(response.message || 'Registration failed');
        }
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Registration error:', error);
        console.error('Error status:', error?.status);
        console.error('Error details:', error?.error);
        
        // Extract the exact error message from various possible error structures
        let errorMessage = 'Registration failed. Please try again.';
        
        // Check for CORS/network errors (status 0)
        if (error?.status === 0) {
          errorMessage = 'Network error: Unable to connect to the server. Please ensure:\n' +
            '1. Backend API is running at http://localhost:8000\n' +
            '2. Backend has CORS enabled for http://localhost:4200\n' +
            '3. Your internet connection is working';
        }
        // Check for 404 errors (common with CORS misconfiguration)
        else if (error?.status === 404) {
          errorMessage = 'Server error: The requested endpoint was not found (404). ' +
            'This usually means CORS is not properly configured on the backend. ' +
            'Please check with the server administrator.';
        }
        // Check for 500 errors
        else if (error?.status >= 500) {
          errorMessage = `Server error (${error?.status}): The server encountered an error. Please try again later.`;
        }
        // Check for 400-level errors
        else if (error?.status >= 400) {
          const detail = error?.error?.detail;
          if (Array.isArray(detail)) {
            // FastAPI validation errors — format each into a readable line
            errorMessage = detail
              .map((d: any) => {
                const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : 'field';
                return `• ${field}: ${d.msg}`;
              })
              .join('\n');
          } else if (typeof detail === 'string') {
            errorMessage = detail;
          } else if (error?.error?.message) {
            errorMessage = error.error.message;
          } else {
            errorMessage = `Error (${error?.status}): Invalid request. Please check your inputs.`;
          }
        }
        // Fallback for other errors
        else if (error?.error?.detail) {
          const detail = error.error.detail;
          errorMessage = Array.isArray(detail)
            ? detail.map((d: any) => `• ${d.loc?.slice(-1)[0] ?? 'field'}: ${d.msg}`).join('\n')
            : String(detail);
        } else if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        this.errorMessage.set(errorMessage);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Navigate back to login page
   */
  goToLogin() {
    this.router.navigate(['/login']);
  }

  /**
   * Get form control for easy access in template
   */
  get f() {
    return this.registerForm.controls;
  }
}
