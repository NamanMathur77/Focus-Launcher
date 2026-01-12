import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, IonLabel, ToastController } from '@ionic/angular/standalone';
import { AppState } from '../services/app-state';
import { InstalledApp, AppLauncher } from '../native/app-launcher';
import { Capacitor } from '@capacitor/core';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-all-apps',
  templateUrl: './all-apps.page.html',
  styleUrls: ['./all-apps.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonList,
    IonItem,
    IonLabel
  ]
})
export class AllAppsPage implements OnInit {

  availableApps$ = this.appState.availableApps$.pipe(
    map(apps => [...apps].sort((a, b) => a.appName.localeCompare(b.appName)))
  );
  backgroundColor$ = this.appState.backgroundColor$;

  constructor(
    private appState: AppState,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    console.log('AllAppsPage loaded');
  }

  getTextColor(backgroundColor: string | null): string {
    return this.appState.getTextColor(backgroundColor || undefined);
  }

  async openApp(app: InstalledApp) {
    if (Capacitor.getPlatform() === 'web') {
      console.warn('openApp skipped on web:', app.packageName);
      return;
    }

    try {
      await AppLauncher.openApp({ packageName: app.packageName });
    } catch (err) {
      console.error('Failed to open app', app.packageName, err);
      const toast = await this.toastCtrl.create({
        message: `Failed to open ${app.appName}`,
        duration: 2000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }
}
