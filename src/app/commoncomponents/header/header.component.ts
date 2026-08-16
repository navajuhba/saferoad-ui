import { Component, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserStateService } from '../../services/user-state.service';
import { SessionAuthService } from '../../services/session.service';
import { ApiResponse, User } from '../../models/index';
import { filter } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  // User profile signal to track reactive updates
  userProfile = signal({
    name: 'Loading...',
    role: 'User',
    avatar: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23667eea'/%3E%3Ccircle cx='20' cy='16' r='7' fill='%23fff'/%3E%3Cellipse cx='20' cy='34' rx='12' ry='8' fill='%23fff'/%3E%3C/svg%3E`,
    notifications: 0
  });

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  // User ID - read from localStorage dynamically
  private userId: string | null = null;

  constructor(
    private userService: UserService,
    private userStateService: UserStateService,
    private router: Router,
    private sessionAuthService: SessionAuthService
  ) {}

  ngOnInit() {
    // Load user ID from localStorage
    this.userId = localStorage.getItem('userId');
    
    // Load user profile immediately if userId exists
    if (this.userId) {
      this.loadUserProfile();
    } else {
      this.isLoading.set(false);
    }

    // Listen for navigation events to reload user data after login
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // Check if userId has been set (after login)
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId && storedUserId !== this.userId) {
          this.userId = storedUserId;
          this.loadUserProfile();
        }
      });
  }

  /**
   * Load user profile data from API using dynamic userId
   */
  loadUserProfile() {
    if (!this.userId) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.userService.getUserDetails(this.userId).subscribe({
      next: (response: ApiResponse<User>) => {
        if (response.data) {
          const userData = response.data;
          this.userProfile.set({
            name: userData.full_name || userData.username || 'User',
            role: userData.username || 'User',
            avatar: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23667eea'/%3E%3Ccircle cx='20' cy='16' r='7' fill='%23fff'/%3E%3Cellipse cx='20' cy='34' rx='12' ry='8' fill='%23fff'/%3E%3C/svg%3E`,
            notifications: 0
          });
          this.userStateService.setUser(userData);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.errorMessage.set('Failed to load user profile');
        this.isLoading.set(false);
        // Keep default profile visible even on error
      }
    });
  }

  /**
   * Set user ID and reload profile (useful for updating when user logs in)
   */
  setUserId(userId: string) {
    this.userId = userId;
    localStorage.setItem('userId', userId);
    this.loadUserProfile();
  }

  onLogout() {
    console.log('User logged out');
    
    // Clear session and localStorage using SessionAuthService
    this.sessionAuthService.logout();
    
    // Reset user profile
    this.userId = null;
    this.userProfile.set({
      name: 'Loading...',
      role: 'User',
      avatar: 'assets/default-avatar.png',
      notifications: 0
    });
    
    // Navigate to login
    this.router.navigate(['/login']);
  }

  onProfileClick() {
    console.log('Profile clicked');
    // TODO: Navigate to profile page
  }

  onNotificationsClick() {
    console.log('Notifications clicked');
    // TODO: Navigate to notifications page
  }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }
}
