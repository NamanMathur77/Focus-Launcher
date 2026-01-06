import { Routes } from '@angular/router';
import { OnboardingGuard } from './guards/onboarding-guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'onboarding',
    pathMatch: 'full',
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.page').then( m => m.SettingsPage)
  },
  {
    path: 'settings/app-settings',
    loadComponent: () => import('./settings/app-settings/app-settings.page').then( m => m.AppSettingsPage)
  },
  {
    path: 'settings/app-details/:packageName',
    loadComponent: () => import('./settings/app-details/app-details.page').then( m => m.AppDetailsPage)
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./pages/onboarding/onboarding.page').then( m => m.OnboardingPage),
    canActivate: [OnboardingGuard]
  },
];
