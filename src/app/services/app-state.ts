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

  /**
   * Toggle selection for a single package.
   * Returns true if the operation succeeded, false if it was rejected
   * (e.g., selection limit reached).
   */
  async toggleAppSelection(pkg: string, selected: boolean): Promise<boolean> {
    const currentSelection = this.selectedAppsSubject.getValue();

    if (selected) {
      // enforce max 7 apps
      if (currentSelection.size >= 7) {
        return false;
      }
      currentSelection.add(pkg);
    } else {
      currentSelection.delete(pkg);
    }

    this.selectedAppsSubject.next(currentSelection);

    await Preferences.set({
      key: 'selectedApps',
      value: JSON.stringify([...currentSelection])
    });

    return true;
  }

  /**
   * Replace the selected apps set atomically and persist it.
   */
  async setSelectedApps(next: Set<string>) {
    // store a new Set to avoid accidental external mutation
    this.selectedAppsSubject.next(new Set(next));

    await Preferences.set({
      key: 'selectedApps',
      value: JSON.stringify([...next])
    });
  }
}
