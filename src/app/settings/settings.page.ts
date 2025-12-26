import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonCheckbox, IonList, IonLabel, IonButton, IonFooter } from '@ionic/angular/standalone';
import { AppLauncher, InstalledApp } from '../native/app-launcher';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { AppState } from '../services/app-state';
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
  emptySet: Set<string> = new Set<string>();

  constructor(private appState: AppState, private toastCtrl: ToastController) { }

  async ngOnInit() {
    console.log('SettingsPage loaded');
    if (Capacitor.getPlatform() === 'web') return;

    this.appState.loadInstalledApps();
    this.appState.loadSelectedApps();
  }

  async toggleApp(pkg: string, checked: boolean) {
    const ok = await this.appState.toggleAppSelection(pkg, checked);
    if (!ok) {
      const t = await this.toastCtrl.create({
        message: 'Only 7 apps can be selected',
        duration: 2000,
        color: 'danger',
        position: 'top'
      });
      await t.present();
    }
  }

  async setSelection(next: Set<string>) {
    if (next.size > 7) {
      const t = await this.toastCtrl.create({
        message: 'Only 7 apps can be selected',
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

      const t = await this.toastCtrl.create({
        message: 'Only 7 apps can be selected',
        duration: 2000,
        color: 'danger',
        position: 'top'
      });
      await t.present();
    }
  }
}