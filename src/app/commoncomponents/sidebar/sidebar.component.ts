import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ViolationService, VerificationService } from '../../services';
import { SessionAuthService } from '../../services/session.service';
import { UserStateService } from '../../services/user-state.service';
import { UserService } from '../../services/user.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
  description?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;

  // Badge counts - loaded from API
  reportsCount = 0;
  verificationsCount = 0;
  notificationsCount = 0;

  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: '📊',
      description: 'Overview and statistics'
    },
    {
      label: 'Report Violation',
      route: '/violations/new',
      icon: '📝',
      description: 'Submit a new violation report'
    },
    {
      label: 'My Reports',
      route: '/violations',
      icon: '📋',
      description: 'View your submitted reports'
    },
    {
      label: 'Verifications',
      route: '/verifications',
      icon: '✓',
      description: 'Verify submitted violations'
    },
    {
      label: 'Rewards',
      route: '/rewards',
      icon: '🏆',
      description: 'Track your earned rewards'
    },
    {
      label: 'Wallet',
      route: '/wallet',
      icon: '💰',
      description: 'Manage your account balance'
    },
    {
      label: 'Notifications',
      route: '/notifications',
      icon: '🔔',
      description: 'View your notifications'
    }
  ];

  adminNavItems: NavItem[] = [
    {
      label: 'Admin Dashboard',
      route: '/admin',
      icon: '⚙️',
      description: 'Admin control panel'
    },
    {
      label: 'User Management',
      route: '/user-management',
      icon: '👥',
      description: 'Manage reporter users'
    },
    {
      label: 'Admin Logs',
      route: '/admin/logs',
      icon: '📖',
      description: 'View admin activities'
    }
  ];

  constructor(
    private router: Router,
    private violationService: ViolationService,
    private verificationService: VerificationService,
    private sessionService: SessionAuthService,
    private userState: UserStateService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.ensureUserLoaded();
    this.loadBadgeCounts();
  }

  /** Fetch user details if the signal is empty (e.g. after a page refresh). */
  private ensureUserLoaded(): void {
    if (this.userState.currentUser()) return;
    const userId = this.sessionService.getUserId();
    if (!userId) return;
    this.userService.getUserDetails(userId).subscribe({
      next: (response: any) => {
        const user = response?.data || response;
        if (user?.user_id) {
          this.userState.setUser(user);
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  isAdminUser(): boolean {
    return this.userState.currentUser()?.user_type_id === 2;
  }

  /**
   * Load badge counts from APIs
   */
  private loadBadgeCounts(): void {
    const userId = this.sessionService.getUserId();
    
    if (!userId) {
      console.warn('User ID not found in session');
      return;
    }

    // Load violation count (My Reports)
    this.violationService.listViolationsByReporter(userId).subscribe(
      (response: any) => {
        let violationsData: any[] = [];
        
        if (Array.isArray(response)) {
          violationsData = response;
        } else if (response && Array.isArray(response.data)) {
          violationsData = response.data;
        } else if (response && response.violations && Array.isArray(response.violations)) {
          violationsData = response.violations;
        } else if (response && response.items && Array.isArray(response.items)) {
          violationsData = response.items;
        } else if (response && response.results && Array.isArray(response.results)) {
          violationsData = response.results;
        }
        
        // Defer badge update to next macrotask to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.reportsCount = violationsData.length;
          this.updateNavItemBadge('My Reports', this.reportsCount);
          this.cdr.markForCheck();
        }, 0);
      },
      (error) => {
        console.error('Error loading violation count:', error);
        setTimeout(() => {
          this.reportsCount = 0;
          this.updateNavItemBadge('My Reports', 0);
          this.cdr.markForCheck();
        }, 0);
      }
    );

    // Load verifications count
    // NOTE: This would require a list endpoint from the backend
    // For now, set to 0 for new users. This should be populated when backend provides
    // a GET /api/v1/verifications endpoint or similar
    setTimeout(() => {
      this.verificationsCount = 0;
      this.updateNavItemBadge('Verifications', this.verificationsCount);
      this.cdr.markForCheck();
    }, 0);

    // Load notifications count
    // NOTE: This would require a notifications service/endpoint
    // For now, set to 0 for new users
    setTimeout(() => {
      this.notificationsCount = 0;
      this.updateNavItemBadge('Notifications', this.notificationsCount);
      this.cdr.markForCheck();
    }, 0);
  }

  /**
   * Update badge count for a specific nav item
   */
  private updateNavItemBadge(label: string, count: number): void {
    const item = this.navItems.find(n => n.label === label);
    if (item) {
      item.badge = count > 0 ? count : undefined;
    }
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      this.isCollapsed = false;
    }
  }

  getCombinedNavItems(): NavItem[] {
    if (this.isAdminUser()) {
      return [
        ...this.navItems,
      { label: 'User Management', route: '/user-management', icon: '👥', description: 'Manage reporter users' }
      ];
    }
    return this.navItems;
  }
}
