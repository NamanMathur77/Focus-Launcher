import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonCheckbox, IonList, IonLabel, IonButton, IonFooter } from '@ionic/angular/standalone';
import { AppLauncher, InstalledApp } from '../native/app-launcher';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { AppState } from '../services/app-state';

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
    IonFooter
]
})
export class SettingsPage implements OnInit {

  apps$ = this.appState.installedApps$;
  selected$ = this.appState.selectedApps$;

  constructor(private appState: AppState) { }

  async ngOnInit() {
    console.log('SettingsPage loaded');
    if (Capacitor.getPlatform() === 'web') return;

    this.appState.loadInstalledApps();
    this.appState.loadSelectedApps();
  }

  toggleApp(pkg: string, checked: boolean) {
    this.appState.toggleAppSelection(pkg, checked);
  }
}