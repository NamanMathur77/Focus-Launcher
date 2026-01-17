import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, IonLabel, IonSearchbar, ToastController } from '@ionic/angular/standalone';
import { AppState } from '../services/app-state';
import { InstalledApp, AppLauncher } from '../native/app-launcher';
import { Capacitor } from '@capacitor/core';
import { map } from 'rxjs/operators';
import { BehaviorSubject, combineLatest } from 'rxjs';

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
    IonLabel,
    IonSearchbar
  ]
})
export class AllAppsPage implements OnInit {

  private searchTermSubject = new BehaviorSubject<string>('');
  searchTerm$ = this.searchTermSubject.asObservable();

  availableApps$ = combineLatest([
    this.appState.availableApps$,
    this.searchTerm$
  ]).pipe(
    map(([apps, searchTerm]) => {
      const sorted = [...apps].sort((a, b) => a.appName.localeCompare(b.appName));
      if (!searchTerm || searchTerm.trim() === '') {
        return sorted;
      }
      const lowerSearch = searchTerm.toLowerCase();
      return sorted.filter(app => 
        app.appName.toLowerCase().includes(lowerSearch)
      );
    })
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

  onSearchChange(event: any) {
    const searchTerm = event.target.value || '';
    this.searchTermSubject.next(searchTerm);
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

  onLongPress(app: InstalledApp, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.router.navigate(['/settings/app-details', app.packageName]);
  }
}
