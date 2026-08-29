import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./commoncomponents/login/login.component').then(m => m.LoginComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./commoncomponents/register/register.component').then(m => m.RegisterComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'violations',
    loadComponent: () => import('./pages/violations/violations.component').then(m => m.ViolationsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'violations/new',
    loadComponent: () => import('./pages/reportviolation/reportviolation').then(m => m.Reportviolation),
    canActivate: [authGuard]
  },
  {
    path: 'rewards',
    loadComponent: () => import('./pages/rewards/rewards.component').then(m => m.RewardsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'wallet',
    loadComponent: () => import('./pages/rewards/rewards.component').then(m => m.RewardsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'verifications',
    loadComponent: () => import('./pages/verifications/verifications.component').then(m => m.VerificationsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    pathMatch: 'full',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'user-management',
    loadComponent: () => import('./pages/usermanagement/usermanagement.component').then(m => m.UsermanagementComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin/logs',
    pathMatch: 'full',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];

