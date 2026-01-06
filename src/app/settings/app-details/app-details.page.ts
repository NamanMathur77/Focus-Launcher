import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonItem, 
  IonList, 
  IonLabel, 
  IonToggle,
  IonButtons, 
  IonBackButton,
  IonButton,
  ToastController,
  AlertController 
} from '@ionic/angular/standalone';
import { AppState } from '../../services/app-state';
import { InstalledApp } from '../../native/app-launcher';
import { map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-app-details',
  templateUrl: './app-details.page.html',
  styleUrls: ['./app-details.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonItem,
    IonList,
    IonLabel,
    IonToggle,
    IonButton,
    IonButtons,
    IonBackButton
  ]
})
export class AppDetailsPage implements OnInit {

  packageName: string = '';
  app: InstalledApp | null = null;
  
  isSelected$ = combineLatest([
    this.appState.selectedApps$,
    this.route.params
  ]).pipe(
    map(([selected, params]) => selected.has(params['packageName']))
  );
  
  isRestricted$ = combineLatest([
    this.appState.restrictedApps$,
    this.route.params
  ]).pipe(
    map(([restricted, params]) => restricted.has(params['packageName']))
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appState: AppState,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    this.packageName = this.route.snapshot.params['packageName'];
    
    // Find the app details from installed apps
    this.appState.installedApps$.subscribe(apps => {
      this.app = apps.find(a => a.packageName === this.packageName) || null;
    });
  }

  async onShowOnMainScreenToggle(event: any) {
    const checked = event.detail.checked;
    const ok = await this.appState.toggleAppSelection(this.packageName, checked);
    
    if (!ok) {
      // Revert the toggle
      event.target.checked = !checked;
      
      const lim = this.appState.getSelectionLimit();
      const t = await this.toastCtrl.create({
        message: `Only ${lim} apps can be selected`,
        duration: 2000,
        color: 'danger',
        position: 'top'
      });
      await t.present();
    }
  }

  async onRestrictAppToggle(event: any) {
    const checked = event.detail.checked;
    
    if (checked) {
      // Restricting the app
      await this.appState.toggleRestrictedApp(this.packageName, true);
      return;
    }

    // Unrestricting the app - show confirmation with 10s countdown
    event.target.checked = true;
    event.target.disabled = true;

    const alert = await this.alertCtrl.create({
      header: 'Wait — think about it',
      message: 'Unrestricting this app in 10 seconds. Press Undo to cancel.',
      buttons: [
        {
          text: 'Undo',
          role: 'cancel'
        }
      ],
      backdropDismiss: false,
      cssClass: 'full-screen-alert'
    });

    await alert.present();

    const timer = setTimeout(async () => {
      try { await alert.dismiss(); } catch (e) {}
    }, 10000);

    const { role } = await alert.onDidDismiss();
    clearTimeout(timer);

    event.target.disabled = false;

    if (role === 'cancel') {
      const t = await this.toastCtrl.create({
        message: 'Action cancelled',
        duration: 1500,
        position: 'top'
      });
      await t.present();
      return;
    }

    // Proceed to unrestrict
    await this.appState.toggleRestrictedApp(this.packageName, false);
    event.target.checked = false;
    
    const done = await this.toastCtrl.create({
      message: 'App unrestricted',
      duration: 1500,
      position: 'top'
    });
    await done.present();
  }

  async uninstallApp() {
    if (Capacitor.getPlatform() === 'web') {
      const t = await this.toastCtrl.create({
        message: 'Uninstall is only available on Android',
        duration: 2000,
        position: 'top'
      });
      await t.present();
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Uninstall App',
      message: `Are you sure you want to uninstall ${this.app?.appName}? This will open the system settings.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Uninstall',
          role: 'destructive',
          handler: () => {
            this.openAppSettings();
          }
        }
      ]
    });

    await alert.present();
  }

  private async openAppSettings() {
    try {
      const { AppLauncher } = await import('../../native/app-launcher');
      await AppLauncher.openAppSettings({ packageName: this.packageName });
    } catch (error) {
      console.error('Error opening app settings:', error);
      const t = await this.toastCtrl.create({
        message: 'Unable to open app settings. Please uninstall manually from Android settings.',
        duration: 3000,
        color: 'warning',
        position: 'top'
      });
      await t.present();
    }
  }
}
