import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonCheckbox, IonList, IonLabel, IonButton, IonFooter, IonInput } from '@ionic/angular/standalone';
import { AppLauncher, InstalledApp } from '../native/app-launcher';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { AppState } from '../services/app-state';
import { map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { ToastController } from '@ionic/angular/standalone';
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

  apps$ = this.appState.installedApps$;
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

  constructor(private appState: AppState, private toastCtrl: ToastController) { }

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
    const ok = await this.appState.toggleRestrictedApp(event.pkg, event.checked);
    if (!ok) {
      try {
        const target = (event.event as any)?.target;
        if (target && 'checked' in target) {
          target.checked = false;
        }
      } catch (e) {}
    }
  }

  async setRestricted(next: Set<string>) {
    await this.appState.setRestrictedApps(next);
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