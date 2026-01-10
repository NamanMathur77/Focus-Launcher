import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonList, IonLabel, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { AppState } from '../../services/app-state';
import { InstalledApp } from '../../native/app-launcher';
import { Capacitor } from '@capacitor/core';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-app-settings',
  templateUrl: './app-settings.page.html',
  styleUrls: ['./app-settings.page.scss'],
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
    IonButtons,
    IonBackButton
  ]
})
export class AppSettingsPage implements OnInit {

  installedApps$ = this.appState.installedApps$.pipe(
    map(apps => [...apps].sort((a, b) => a.appName.localeCompare(b.appName)))
  );
  backgroundColor$ = this.appState.backgroundColor$;

  constructor(private appState: AppState, private router: Router) {}

  getTextColor(backgroundColor: string | null): string {
    return this.appState.getTextColor(backgroundColor || undefined);
  }

  async ngOnInit() {
    console.log('AppSettingsPage loaded');
    if (Capacitor.getPlatform() === 'web') return;
    this.appState.loadInstalledApps();
  }

  onAppClick(app: InstalledApp) {
    // Navigate to app details page with the package name
    this.router.navigate(['/settings/app-details', app.packageName]);
  }
}
