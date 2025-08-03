import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth/guard/auth.guard.service';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full'
  },
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
    canActivate: [AuthGuard]
  },
  {
    path: 'recharge',
    loadComponent: () => import('./tabs/recharge/recharge.page').then( m => m.RechargePage),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.page').then( m => m.AdminPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'signup',
    loadComponent: () => import('./pages/signup/signup.page').then( m => m.SignupPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then( m => m.SettingsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'tabs/buy-airtime/enhanced-purchase',
    loadComponent: () => import('./tabs/buy-airtime/enhanced-airtime-purchase.page').then( m => m.EnhancedAirtimePurchasePage),
    canActivate: [AuthGuard]
  }
];
