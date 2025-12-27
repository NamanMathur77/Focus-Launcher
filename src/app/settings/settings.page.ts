import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonCheckbox, IonList, IonLabel, IonButton, IonFooter, IonInput } from '@ionic/angular/standalone';
import { AppLauncher, InstalledApp } from '../native/app-launcher';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { AppState } from '../services/app-state';
import { map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { AppListComponent } from "../common/app-list/app-list.component";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonItem,
    IonCheckbox,
    IonInput,
    IonList,
    IonLabel,
    IonButton,
    IonFooter,
    AppListComponent
]
})
export class SettingsPage implements OnInit {

  apps$ = this.appState.availableApps$;
  selected$ = this.appState.selectedApps$;
  restricted$ = this.appState.restrictedApps$;
  emptySet: Set<string> = new Set<string>();
  selectedCount$ = this.selected$.pipe(map(s => s.size));
  showApps = false;
  showSelectedList = false;
  showRestricted = false;
  selectionLimit$ = this.appState.selectionLimit$;
  countAndLimit$ = combineLatest([this.selected$, this.selectionLimit$]).pipe(
    map(([s, lim]) => ({ cnt: s.size, lim }))
  );
  restrictedCount$ = this.restricted$.pipe(map(s => s.size));
  // All installed apps (used for the Restricted Apps list so users can pick any app to restrict)
  installed$ = this.appState.installedApps$;

  constructor(private appState: AppState, private toastCtrl: ToastController, private alertCtrl: AlertController) { }

  async ngOnInit() {
    console.log('SettingsPage loaded');
    if (Capacitor.getPlatform() === 'web') return;

    this.appState.loadInstalledApps();
    this.appState.loadSelectedApps();
    this.appState.loadSelectionLimit();
    this.appState.loadRestrictedApps();
  }

  async toggleApp(pkg: string, checked: boolean) {
    const ok = await this.appState.toggleAppSelection(pkg, checked);
    if (!ok) {
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

  async setSelection(next: Set<string>) {
    const limit = this.appState.getSelectionLimit();
    if (next.size > limit) {
      const t = await this.toastCtrl.create({
        message: `Only ${limit} apps can be selected`,
        duration: 2000,
        color: 'danger',
        position: 'top'
      });
      await t.present();
      return;
    }

    await this.appState.setSelectedApps(next);
  }

  async onToggleRequest(event: { pkg: string; checked: boolean; event?: Event }) {
    const ok = await this.appState.toggleAppSelection(event.pkg, event.checked);
    if (!ok) {
      // revert the toggle element visually since the selection was rejected
      try {
        const target = (event.event as any)?.target;
        if (target && 'checked' in target) {
          // reset to false
          target.checked = false;
        }
      } catch (e) {
        // ignore DOM errors
      }

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

  // Restricted handlers
  async onRestrictedToggle(event: { pkg: string; checked: boolean; event?: Event }) {
    const pkg = event.pkg;
    const requested = event.checked;

    // If user is *restricting* an app, apply immediately
    if (requested) {
      await this.appState.toggleRestrictedApp(pkg, true);
      return;
    }

    // User is attempting to *unrestrict* an app: show a 10s popup with Undo
    // Keep the toggle visually ON during the countdown and disable it to avoid
    // race interactions.
    let target: any = (event.event as any)?.target;
    try {
      if (target && 'checked' in target) {
        // keep it checked while waiting
        target.checked = true;
        target.disabled = true;
      }
    } catch (e) {
      target = undefined;
    }

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

    // auto-dismiss after 10s if user doesn't press Undo
    const timer = setTimeout(async () => {
      try { await alert.dismiss(); } catch (e) {}
    }, 10000);

    const { role } = await alert.onDidDismiss();
    clearTimeout(timer);

    // Re-enable the toggle if we disabled it earlier
    try {
      if (target) target.disabled = false;
    } catch (e) {}

    if (role === 'cancel') {
      // user cancelled the unrestrict — keep it restricted (no-op)
      const t = await this.toastCtrl.create({
        message: 'Action cancelled',
        duration: 1500,
        position: 'top'
      });
      await t.present();
      return;
    }

    // timed out without undo — proceed to unrestrict
    await this.appState.toggleRestrictedApp(pkg, false);
    const done = await this.toastCtrl.create({
      message: 'App unrestricted',
      duration: 1500,
      position: 'top'
    });
    await done.present();
  }

  async setRestricted(next: Set<string>) {
    await this.appState.setRestrictedApps(next);
  }

  toggleSelected() {
    this.showSelectedList = !this.showSelectedList;
    if (this.showSelectedList) {
      this.showRestricted = false;
    }
  }

  toggleRestricted() {
    this.showRestricted = !this.showRestricted;
    if (this.showRestricted) {
      this.showSelectedList = false;
    }
  }

  async onLimitChange(ev: any) {
    const raw = ev?.detail?.value ?? ev?.target?.value;
    const val = Number(raw);
    const requested = Number.isFinite(val) && val > 0 ? Math.floor(val) : 1;
    // Service enforces [1,10], but let user know if they tried to exceed 10
    const clamped = Math.min(10, Math.max(1, requested));

    if (requested > 10) {
      // reflect clamped value back into input
      try {
        if (ev?.detail) ev.detail.value = clamped;
        if (ev?.target) (ev.target as any).value = clamped;
      } catch (e) {}

      const toast = await this.toastCtrl.create({
        message: 'Maximum allowed is 10',
        duration: 2000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
    }

    const res = await this.appState.setSelectionLimit(clamped);
    if (res.trimmed) {
      const t = await this.toastCtrl.create({
        message: `Selection trimmed to ${clamped} apps`,
        duration: 2000,
        color: 'warning',
        position: 'top'
      });
      await t.present();
    }
  }
}