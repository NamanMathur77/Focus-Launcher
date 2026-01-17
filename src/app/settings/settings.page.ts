import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';
import { AppState } from '../services/app-state';
import { Capacitor } from '@capacitor/core';
import { AppLauncher } from '../native/app-launcher';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonList,
    IonItem,
    IonLabel
]
})
export class SettingsPage implements OnInit {
  backgroundColor$ = this.appState.backgroundColor$;

  constructor(private router: Router, private appState: AppState) { }

  async ngOnInit() {
    console.log('SettingsPage loaded');
  }

  getTextColor(backgroundColor: string | null): string {
    return this.appState.getTextColor(backgroundColor || undefined);
  }

  navigateToAppSettings() {
    this.router.navigate(['/settings/app-settings']);
  }

  navigateToBackgroundSettings() {
    this.router.navigate(['/settings/background-color']);
  }

  navigateToAppLimit() {
    this.router.navigate(['/settings/app-limit']);
  }

  async openPhoneSettings() {
    if (Capacitor.getPlatform() === 'web') {
      console.warn('Phone settings not available on web');
      return;
    }

    try {
      const intent = await (AppLauncher as any).openApp({ 
        packageName: 'com.android.settings' 
      });
    } catch (error) {
      console.error('Failed to open phone settings:', error);
    }
  }
}