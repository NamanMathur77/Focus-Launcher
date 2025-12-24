import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonButton } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { AppLauncher, InstalledApp } from '../native/app-launcher';
import { Preferences } from '@capacitor/preferences';
import { RouterLinkActive } from "@angular/router";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [CommonModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonList, IonLabel, IonButtons, IonButton, RouterLinkActive],
  standalone: true,
})
export class HomePage implements OnInit {

  apps: InstalledApp[] = [];
  failedToLoadApps = false;

  async ngOnInit() {
    if (Capacitor.getPlatform() === 'web') return;

      const result = await AppLauncher.getInstalledApps();
      console.log('Installed apps retrieved:', result.apps.length);
      const allApps = result.apps;

      const saved = await Preferences.get({ key: 'selectedApps' });

      if (!saved.value) {
        this.apps = [];
        return;
      }

      const allowed = new Set<string>(JSON.parse(saved.value));

      this.apps = allApps.filter(app =>
        allowed.has(app.packageName)
      );

    console.log('HomePage loaded');
  }

  openApp(app: InstalledApp) {
    // Guard native plugin calls on web and log failures
    (async () => {
      if (Capacitor.getPlatform() === 'web') {
        console.warn('openApp skipped on web:', app.packageName);
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
