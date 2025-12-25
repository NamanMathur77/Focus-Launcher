import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { AppLauncher, InstalledApp } from '../native/app-launcher';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class AppState {
  private installedAppsSubject  = new BehaviorSubject<InstalledApp[]>([]);
  private selectedAppsSubject  = new BehaviorSubject<Set<string>>(new Set());

  installedApps$ = this.installedAppsSubject.asObservable();
  selectedApps$ = this.selectedAppsSubject.asObservable();

  visibleApps$ = combineLatest([
    this.installedApps$,
    this.selectedApps$]).pipe(
      map(([installedApps, selectedApps]) =>
        installedApps.filter(app => selectedApps.has(app.packageName))
      )
    );

  async loadInstalledApps(){
    if(Capacitor.getPlatform() === 'web') return;

    const result = await AppLauncher.getInstalledApps();
    console.log('Installed apps retrieved:', result.apps.length);
    this.installedAppsSubject.next(result.apps);
  }

  async loadSelectedApps(){
    const saved = await Preferences.get({ key: 'selectedApps' });
    if(saved.value) {
      this.selectedAppsSubject.next(new Set(JSON.parse(saved.value)));
    }
  }

  async toggleAppSelection(pkg: string, selected: boolean) {
    const currentSelection = this.selectedAppsSubject.getValue();
    if (selected) {
      currentSelection.add(pkg);
    } else {
      currentSelection.delete(pkg);
    }
    this.selectedAppsSubject.next(currentSelection);

    await Preferences.set({
      key: 'selectedApps',
      value: JSON.stringify([...currentSelection])
    });
  }
}
