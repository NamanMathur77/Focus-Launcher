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
  private restrictedAppsSubject = new BehaviorSubject<Set<string>>(new Set());
  private selectionLimitSubject = new BehaviorSubject<number>(7);

  installedApps$ = this.installedAppsSubject.asObservable();
  selectedApps$ = this.selectedAppsSubject.asObservable();
  restrictedApps$ = this.restrictedAppsSubject.asObservable();

  visibleApps$ = combineLatest([
    this.installedApps$,
    this.selectedApps$]).pipe(
      map(([installedApps, selectedApps]) =>
        installedApps.filter(app => selectedApps.has(app.packageName))
      )
    );

  selectionLimit$ = this.selectionLimitSubject.asObservable();

  /** Return the current selection limit synchronously. */
  getSelectionLimit(): number {
    return this.selectionLimitSubject.getValue();
  }

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

  async loadRestrictedApps(){
    const saved = await Preferences.get({ key: 'restrictedApps' });
    if (saved.value) {
      this.restrictedAppsSubject.next(new Set(JSON.parse(saved.value)));
    }
  }

  async loadSelectionLimit(){
    const saved = await Preferences.get({ key: 'selectionLimit' });
    const limit = saved.value ? Number(saved.value) : 7;
    this.selectionLimitSubject.next(Number.isFinite(limit) && limit > 0 ? limit : 7);
  }

  /**
   * Toggle selection for a single package.
   * Returns true if the operation succeeded, false if it was rejected
   * (e.g., selection limit reached).
   */
  async toggleAppSelection(pkg: string, selected: boolean): Promise<boolean> {
    const currentSelection = this.selectedAppsSubject.getValue();
    const limit = this.selectionLimitSubject.getValue();

    if (selected) {
      if (currentSelection.size >= limit) {
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

  /** Toggle a package in the restricted set. Always succeeds and returns true. */
  async toggleRestrictedApp(pkg: string, restricted: boolean): Promise<boolean> {
    const current = this.restrictedAppsSubject.getValue();
    if (restricted) {
      current.add(pkg);
    } else {
      current.delete(pkg);
    }
    this.restrictedAppsSubject.next(current);

    await Preferences.set({ key: 'restrictedApps', value: JSON.stringify([...current]) });
    return true;
  }

  /**
   * Replace the selected apps set atomically and persist it.
   */
  async setSelectedApps(next: Set<string>) {
    const limit = this.selectionLimitSubject.getValue();
    let final = new Set(next);
    let trimmed = false;
    if (final.size > limit) {
      // trim to first `limit` entries
      const arr = [...final].slice(0, limit);
      final = new Set(arr);
      trimmed = true;
    }

    // store a new Set to avoid accidental external mutation
    this.selectedAppsSubject.next(new Set(final));

    await Preferences.set({
      key: 'selectedApps',
      value: JSON.stringify([...final])
    });

    return { trimmed, final };
  }

  /** Replace the restricted set and persist it. */
  async setRestrictedApps(next: Set<string>) {
    this.restrictedAppsSubject.next(new Set(next));
    await Preferences.set({ key: 'restrictedApps', value: JSON.stringify([...next]) });
    return { final: new Set(next) };
  }

  /**
   * Set a new selection limit (must be >=1). If the current selection exceeds
   * the new limit, it will be trimmed and persisted. Returns an object
   * describing whether trimming occurred and the new selected set.
   */
  async setSelectionLimit(limit: number) {
    // enforce min 1 and max 10 for safety
    const nextLimit = Math.max(1, Math.min(10, Math.floor(Number(limit) || 1)));
    this.selectionLimitSubject.next(nextLimit);
    await Preferences.set({ key: 'selectionLimit', value: String(nextLimit) });

    const currentSelection = this.selectedAppsSubject.getValue();
    if (currentSelection.size > nextLimit) {
      const arr = [...currentSelection].slice(0, nextLimit);
      const final = new Set(arr);
      this.selectedAppsSubject.next(final);
      await Preferences.set({
        key: 'selectedApps',
        value: JSON.stringify([...final])
      });
      return { trimmed: true, final };
    }

    return { trimmed: false, final: currentSelection };
  }
}
