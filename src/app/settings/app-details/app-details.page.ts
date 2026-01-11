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
  AlertController,
  ActionSheetController 
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
  backgroundColor$ = this.appState.backgroundColor$;
  
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
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController
  ) {}

  async ngOnInit() {
    this.packageName = this.route.snapshot.params['packageName'];
    
    // Find the app details from installed apps
    this.appState.installedApps$.subscribe(apps => {
      this.app = apps.find(a => a.packageName === this.packageName) || null;
    });
  }

  getTextColor(backgroundColor: string | null): string {
    return this.appState.getTextColor(backgroundColor || undefined);
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
      // Restricting the app - show confirmation first
      event.target.checked = false;
      
      const alert = await this.alertCtrl.create({
        header: 'Restrict This App?',
        message: `Once you restrict this app, it will disappear from your home screen.\n\nThis isn't about punishment — it's about giving your mind fewer places to wander.\n\nYou can undo this later, but each change breaks the calm you're trying to build.\n\nAre you sure you want to continue?`,
        backdropDismiss: false,
        buttons: [
          {
            text: 'Not now',
            role: 'cancel',
            handler: () => {
              event.target.checked = false;
            }
          },
          {
            text: "Yes, I'm ready",
            handler: async () => {
              event.target.checked = true;
              await this.appState.toggleRestrictedApp(this.packageName, true);
              await this.appState.clearTemporaryUnrestriction(this.packageName);
            }
          }
        ]
      });

      await alert.present();
      return;
    }

    // Unrestricting the app - show warning first
    event.target.checked = true;
    event.target.disabled = true;

    await this.showUnrestrictWarning(event.target);
  }

  private async showUnrestrictWarning(toggleElement: any) {
    let alertDismissed = false;
    let countdown = 15;
    
    const alert = await this.alertCtrl.create({
      header: 'Think Before You Unrestrict',
      message: `Do you really want to unrestrict this app? Recall why you restricted it in the first place.\n\nUnrestricting in ${countdown} seconds...`,
      backdropDismiss: false,
      buttons: [
        {
          text: 'Undo',
          role: 'cancel',
          handler: () => {
            alertDismissed = true;
            toggleElement.disabled = false;
          }
        }
      ]
    });

    await alert.present();

    // Update countdown every second
    const countdownInterval = setInterval(async () => {
      countdown--;
      if (countdown > 0 && !alertDismissed) {
        const messageEl = document.querySelector('ion-alert .alert-message');
        if (messageEl) {
          messageEl.textContent = `Do you really want to unrestrict this app? Recall why you restricted it in the first place.\n\nUnrestricting in ${countdown} seconds...`;
        }
      } else {
        clearInterval(countdownInterval);
      }
    }, 1000);

    // Auto-dismiss after 15 seconds if user doesn't click undo
    setTimeout(async () => {
      if (!alertDismissed) {
        clearInterval(countdownInterval);
        await alert.dismiss();
        
        // Show toast message
        const toast = await this.toastCtrl.create({
          message: 'Please choose the time you want to unrestrict this app for',
          duration: 2000,
          position: 'top',
          color: 'primary'
        });
        await toast.present();
        
        this.showUnrestrictTimeOptions(toggleElement);
      }
    }, 15000);

    const { role } = await alert.onDidDismiss();
    if (role === 'cancel') {
      clearInterval(countdownInterval);
      // User clicked undo, don't unrestrict
      return;
    }
  }

  private async showUnrestrictTimeOptions(toggleElement: any) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Unrestrict App For',
      buttons: [
        {
          text: '2 Minutes',
          handler: () => {
            this.unrestrictAppWithTimer(2, toggleElement);
          }
        },
        {
          text: '10 Minutes',
          handler: () => {
            this.unrestrictAppWithTimer(10, toggleElement);
          }
        },
        {
          text: '20 Minutes',
          handler: () => {
            this.unrestrictAppWithTimer(20, toggleElement);
          }
        },
        {
          text: '40 Minutes',
          handler: () => {
            this.unrestrictAppWithTimer(40, toggleElement);
          }
        },
        {
          text: 'Permanently Unrestrict',
          role: 'destructive',
          handler: () => {
            this.showPermanentUnrestrictConfirmation(toggleElement);
          }
        },
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            toggleElement.disabled = false;
          }
        }
      ]
    });

    await actionSheet.present();
  }

  private async unrestrictAppWithTimer(minutes: number, toggleElement: any) {
    // Unrestrict the app
    await this.appState.toggleRestrictedApp(this.packageName, false);
    
    // Set a timer to re-restrict
    const expiryTime = Date.now() + (minutes * 60 * 1000);
    await this.appState.setTemporaryUnrestriction(this.packageName, expiryTime);
    
    toggleElement.checked = false;
    toggleElement.disabled = false;
    
    const toast = await this.toastCtrl.create({
      message: `App unrestricted for ${minutes} minutes`,
      duration: 2000,
      position: 'top',
      color: 'success'
    });
    await toast.present();

    // Schedule re-restriction
    setTimeout(async () => {
      const currentExpiry = this.appState.getTemporaryUnrestrictionExpiry(this.packageName);
      // Only re-restrict if the expiry time matches (not cancelled or changed)
      if (currentExpiry === expiryTime) {
        await this.appState.toggleRestrictedApp(this.packageName, true);
        await this.appState.clearTemporaryUnrestriction(this.packageName);
        
        const restrictedToast = await this.toastCtrl.create({
          message: `${this.app?.appName} has been restricted again`,
          duration: 2000,
          position: 'top',
          color: 'warning'
        });
        await restrictedToast.present();
      }
    }, minutes * 60 * 1000);
  }

  private async showPermanentUnrestrictConfirmation(toggleElement: any) {
    const alert = await this.alertCtrl.create({
      header: 'Wait — think about it',
      message: 'Permanently unrestricting this app in 10 seconds. Press Undo to cancel.',
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

    toggleElement.disabled = false;

    if (role === 'cancel') {
      const t = await this.toastCtrl.create({
        message: 'Action cancelled',
        duration: 1500,
        position: 'top'
      });
      await t.present();
      return;
    }

    // Proceed to permanently unrestrict
    await this.appState.toggleRestrictedApp(this.packageName, false);
    await this.appState.clearTemporaryUnrestriction(this.packageName);
    toggleElement.checked = false;
    
    const done = await this.toastCtrl.create({
      message: 'App permanently unrestricted',
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
