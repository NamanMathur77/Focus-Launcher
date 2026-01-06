import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonButton, ToastController } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { AppLauncher, InstalledApp } from '../native/app-launcher';
import { Preferences } from '@capacitor/preferences';
import { RouterLinkActive } from "@angular/router";
import { AppState } from '../services/app-state';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [CommonModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonList, IonLabel, IonButtons, IonButton, RouterLinkActive],
  standalone: true,
})
export class HomePage implements OnInit {

  apps$ = this.appState.visibleApps$;
  failedToLoadApps = false;

  constructor(private appState: AppState, private toastCtrl: ToastController) {
  }

  async ngOnInit() {
    if (Capacitor.getPlatform() === 'web') return;

    await this.appState.loadInstalledApps();
    await this.appState.loadSelectedApps();
    await this.appState.loadRestrictedApps();

    console.log('HomePage loaded');
  }

  openApp(app: InstalledApp) {
    // Guard native plugin calls on web and log failures
    (async () => {
      if (Capacitor.getPlatform() === 'web') {
        console.warn('openApp skipped on web:', app.packageName);
        return;
      }

      // Check if app is restricted
      const restrictedApps = this.appState.getRestrictedApps();
      if (restrictedApps.has(app.packageName)) {
        const toast = await this.toastCtrl.create({
          message: `${app.appName} is restricted`,
          duration: 2000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
        return;
      }

      try {
        await AppLauncher.openApp({ packageName: app.packageName });
      } catch (err) {
        console.error('Failed to open app', app.packageName, err);
      }
    })();
  }
}
