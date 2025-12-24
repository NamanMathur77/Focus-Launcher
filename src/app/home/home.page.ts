import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { AppLauncher, InstalledApp } from '../native/app-launcher';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent],
  standalone: true,
})
export class HomePage implements OnInit {

  apps: InstalledApp[] = [];
  failedToLoadApps = false;

  async ngOnInit() {
    // Don't call native plugins when running in the browser (ionic serve)
    if (Capacitor.getPlatform() === 'web') {
      console.log('Running on web — skipping AppLauncher plugin');
      this.apps = [];
      return;
    }
    try {
      const result = await AppLauncher.getInstalledApps();
      // Some native plugin implementations may return JSObject/JSONArray wrappers
      // Normalize to a plain array before assigning to the template-bound variable
      this.apps = Array.isArray(result?.apps) ? result.apps : [];
      console.log('Installed apps:', this.apps);
    } catch (err) {
      // Log errors so they show up in logcat / remote debugger instead of failing silently
      console.error('Failed to get installed apps:', err);
      this.apps = [];
      this.failedToLoadApps = true;

    }

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
