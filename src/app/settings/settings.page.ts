import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonCheckbox, IonList, IonLabel, IonButton } from '@ionic/angular/standalone';
import { AppLauncher, InstalledApp } from '../native/app-launcher';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

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
    IonButton
  ]
})
export class SettingsPage implements OnInit {

  apps: InstalledApp[] = [];
  selectedApps = new Set<string>();

  async ngOnInit() {
    console.log('SettingsPage loaded');
    if (Capacitor.getPlatform() === 'web') return;

    const saved = await Preferences.get({ key: 'selectedApps' });
    if (saved.value) {
      JSON.parse(saved.value).forEach((p: string) => this.selectedApps.add(p));
    }

    const result = await AppLauncher.getInstalledApps();
    this.apps = result.apps;
  }

  toggleApp(pkg: string, checked: boolean) {
    checked ? this.selectedApps.add(pkg) : this.selectedApps.delete(pkg);
  }

  async save() {
    await Preferences.set({
      key: 'selectedApps',
      value: JSON.stringify([...this.selectedApps])
    });
  }
}