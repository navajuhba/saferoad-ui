import { Component, signal, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './commoncomponents/header/header.component';
import { SidebarComponent } from './commoncomponents/sidebar/sidebar.component';
import { ToasterComponent } from './commoncomponents/toaster/toaster.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent, ToasterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('saferoad-ui');
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;

  // Signal to track if header/sidebar should be shown
  showHeaderSidebar = signal(false);

  constructor(private router: Router) {}

  ngOnInit() {
    // Check initial route
    this.updateHeaderSidebarVisibility();

    // Listen for route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateHeaderSidebarVisibility();
      });
  }

  /**
   * Determine if header and sidebar should be shown based on current route
   */
  private updateHeaderSidebarVisibility() {
    const url = this.router.url.split('?')[0];
    // Hide header/sidebar on public pages (home, login, register)
    const publicPage =
      url === '/' ||
      url.includes('/home') ||
      url.includes('/login') ||
      url.includes('/register');
    this.showHeaderSidebar.set(!publicPage);
  }

  onToggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }
}
