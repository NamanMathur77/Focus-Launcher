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
    path: 'settings/background-color',
    loadComponent: () => import('./settings/background-color/background-color.page').then( m => m.BackgroundColorPage)
  },
  {
    path: 'settings/app-limit',
    loadComponent: () => import('./settings/app-limit/app-limit.page').then( m => m.AppLimitPage)
  },
  {
    path: 'notes',
    loadComponent: () => import('./notes/notes.page').then( m => m.NotesPage)
  },
  {
    path: 'all-apps',
    loadComponent: () => import('./all-apps/all-apps.page').then( m => m.AllAppsPage)
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./pages/onboarding/onboarding.page').then( m => m.OnboardingPage),
    canActivate: [OnboardingGuard]
  },
];
