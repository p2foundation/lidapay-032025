import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../services/storage.service';

export const authGuard = async () => {
  const router = inject(Router);
  const storage = inject(StorageService);

  try {
    const token = await storage.getStorage('token');
    if (token) {
      return true;
    }
    router.navigate(['/login']);
    return false;
  } catch (error) {
    router.navigate(['/login']);
    return false;
  }
}; 