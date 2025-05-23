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
    const token = await this.authService.checkLoggedIn();
    if (token) {
      return true; // Token is available, allow navigation
    } else {
      this.router.navigate(['/login']); // Redirect to login page
      return false; // Prevent navigation
    }
  }
}