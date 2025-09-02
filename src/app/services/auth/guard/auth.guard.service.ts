import { Injectable } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

  canActivate: CanActivateFn = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> => {
    try {
      const token = await this.authService.checkLoggedIn();
      if (token) {
        // Also check if user profile is available, wait for it if needed
        const profile = await this.authService.waitForUserProfile(3000);
        if (profile && profile._id) {
          console.log('Auth guard: User profile available, allowing navigation');
          return true; // Both token and profile are available
        } else {
          console.log('Auth guard: User profile not ready after waiting, redirecting to login');
          this.router.navigate(['/login']);
          return false;
        }
      } else {
        console.log('Auth guard: No token available, redirecting to login');
        this.router.navigate(['/login']); // Redirect to login page
        return false; // Prevent navigation
      }
    } catch (error) {
      console.error('Auth guard error:', error);
      this.router.navigate(['/login']);
      return false;
    }
  }
}