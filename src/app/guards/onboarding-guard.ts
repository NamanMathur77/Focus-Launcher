import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class OnboardingGuard implements CanActivate {

  constructor(private router: Router) {}

  async canActivate(): Promise<boolean> {
    const { value } = await Preferences.get({
      key: 'onboarding_completed',
    });

    if (value === 'true') {
      this.router.navigateByUrl('/home', { replaceUrl: true });
      return false;
    }

    return true;
  }
}