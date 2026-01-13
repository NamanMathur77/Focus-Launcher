import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { AppLauncher, InstalledApp } from '../native/app-launcher';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AppState {
  private installedAppsSubject  = new BehaviorSubject<InstalledApp[]>([]);
  private selectedAppsSubject  = new BehaviorSubject<Set<string>>(new Set());
  private restrictedAppsSubject = new BehaviorSubject<Set<string>>(new Set());
  private selectionLimitSubject = new BehaviorSubject<number>(7);
  private backgroundColorSubject = new BehaviorSubject<string>('#000000');
  
  private temporaryUnrestrictions = new Map<string, number>(); // packageName -> expiryTime
  private checkInterval: any;

  installedApps$ = this.installedAppsSubject.asObservable();
  selectedApps$ = this.selectedAppsSubject.asObservable();
  restrictedApps$ = this.restrictedAppsSubject.asObservable();
  backgroundColor$ = this.backgroundColorSubject.asObservable();

  /** Apps available for selection/viewing (installed minus restricted) */
  availableApps$ = combineLatest([this.installedApps$, this.restrictedApps$]).pipe(
    map(([installed, restricted]) => installed.filter(a => !restricted.has(a.packageName)))
  );

  /** Apps visible on the home screen: available apps that are selected by the user */
  visibleApps$ = combineLatest([this.availableApps$, this.selectedApps$]).pipe(
    map(([available, selected]) => {
      // Always include essential apps (Phone, Messages, Camera)
      const essentialPackages = [
        'com.android.dialer',           // Phone
        'com.google.android.dialer',    // Google Phone
        'com.android.contacts',         // Contacts (often includes dialer)
        'com.android.mms',              // Messages
        'com.google.android.apps.messaging', // Google Messages
        'com.android.camera',           // Camera
        'com.android.camera2',          // Camera2
        'com.google.android.GoogleCamera' // Google Camera
      ];
      
      // Filter available apps that are either selected OR essential
      return available.filter(app => 
        selected.has(app.packageName) || essentialPackages.includes(app.packageName)
      );
    })
  );

  selectionLimit$ = this.selectionLimitSubject.asObservable();

  constructor(private router: Router) {
    this.startExpiryCheck();
    this.loadTemporaryUnrestrictions();
    this.loadBackgroundColor();
  }

  /** Return the current selection limit synchronously. */
  getSelectionLimit(): number {
    return this.selectionLimitSubject.getValue();
  }

  /** Return the current restricted apps set synchronously. */
  getRestrictedApps(): Set<string> {
    return this.restrictedAppsSubject.getValue();
  }

  async loadInstalledApps(){
    if(Capacitor.getPlatform() === 'web') return;

    const result = await AppLauncher.getInstalledApps();
    console.log('Installed apps retrieved:', result.apps.length);
    this.installedAppsSubject.next(result.apps);
  }

  async loadSelectedApps(){
    const saved = await Preferences.get({ key: 'selectedApps' });
    const selectedSet = new Set<string>();
    
    if(saved.value) {
      const arr = JSON.parse(saved.value) as string[];
      arr.forEach(pkg => selectedSet.add(pkg));
    }
    
    // Add essential apps to selected apps if they're installed (will be checked when rendering)
    const essentialPackages = [
      'com.android.dialer',
      'com.google.android.dialer',
      'com.android.contacts',
      'com.android.mms',
      'com.google.android.apps.messaging',
      'com.android.camera',
      'com.android.camera2',
      'com.google.android.GoogleCamera'
    ];
    
    essentialPackages.forEach(pkg => selectedSet.add(pkg));
    
    this.selectedAppsSubject.next(selectedSet);
  }

  async loadRestrictedApps(){
    const saved = await Preferences.get({ key: 'restrictedApps' });
    if (saved.value) {
      const arr = JSON.parse(saved.value) as string[];
      const restricted = new Set<string>(arr || []);
      this.restrictedAppsSubject.next(restricted);

      // Ensure selected apps do not contain restricted packages
      const currentSelection = this.selectedAppsSubject.getValue();
      const filtered = new Set([...currentSelection].filter(pkg => !restricted.has(pkg)));
      if (filtered.size !== currentSelection.size) {
        this.selectedAppsSubject.next(filtered);
        await Preferences.set({ key: 'selectedApps', value: JSON.stringify([...filtered]) });
      }
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
      // If we restrict the app, remove it from the selected set if present
      const currentSelection = this.selectedAppsSubject.getValue();
      if (currentSelection.has(pkg)) {
        currentSelection.delete(pkg);
        this.selectedAppsSubject.next(currentSelection);
        await Preferences.set({ key: 'selectedApps', value: JSON.stringify([...currentSelection]) });
      }
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
    const newRestricted = new Set(next);
    this.restrictedAppsSubject.next(newRestricted);
    await Preferences.set({ key: 'restrictedApps', value: JSON.stringify([...newRestricted]) });

    // Trim any selected apps that are now restricted
    const currentSelection = this.selectedAppsSubject.getValue();
    const filtered = new Set([...currentSelection].filter(pkg => !newRestricted.has(pkg)));
    if (filtered.size !== currentSelection.size) {
      this.selectedAppsSubject.next(filtered);
      await Preferences.set({ key: 'selectedApps', value: JSON.stringify([...filtered]) });
    }

    return { final: new Set(newRestricted) };
  }

  /**
   * Set a new selection limit (must be >=1). If the current selection exceeds
   * the new limit, it will be trimmed and persisted. Returns an object
   * describing whether trimming occurred and the new selected set.
   */
  async setSelectionLimit(limit: number) {
    // enforce min 1 and max 50 for safety
    const nextLimit = Math.max(1, Math.min(50, Math.floor(Number(limit) || 1)));
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

  private async loadTemporaryUnrestrictions() {
    const saved = await Preferences.get({ key: 'temporaryUnrestrictions' });
    if (saved.value) {
      const entries = JSON.parse(saved.value) as [string, number][];
      this.temporaryUnrestrictions = new Map(entries);
      
      // Check for any expired ones immediately
      await this.checkExpiredUnrestrictions();
    }
  }

  async setTemporaryUnrestriction(packageName: string, expiryTime: number) {
    this.temporaryUnrestrictions.set(packageName, expiryTime);
    await Preferences.set({
      key: 'temporaryUnrestrictions',
      value: JSON.stringify(Array.from(this.temporaryUnrestrictions.entries()))
    });
  }

  async clearTemporaryUnrestriction(packageName: string) {
    this.temporaryUnrestrictions.delete(packageName);
    await Preferences.set({
      key: 'temporaryUnrestrictions',
      value: JSON.stringify(Array.from(this.temporaryUnrestrictions.entries()))
    });
  }

  getTemporaryUnrestrictionExpiry(packageName: string): number | undefined {
    return this.temporaryUnrestrictions.get(packageName);
  }

  private startExpiryCheck() {
    // Check every 5 seconds (reduced from 30 for faster response)
    this.checkInterval = setInterval(() => {
      this.checkExpiredUnrestrictions();
    }, 5000);
  }

  private async checkExpiredUnrestrictions() {
    const now = Date.now();
    const expired: string[] = [];

    for (const [packageName, expiryTime] of this.temporaryUnrestrictions.entries()) {
      if (now >= expiryTime) {
        expired.push(packageName);
      }
    }

    for (const packageName of expired) {
      await this.toggleRestrictedApp(packageName, true);
      await this.clearTemporaryUnrestriction(packageName);
      
      // If user is currently on this app's page, navigate back to home
      if (this.router.url.includes(packageName)) {
        this.router.navigate(['/home']);
      }
    }
  }

  async loadBackgroundColor() {
    const saved = await Preferences.get({ key: 'backgroundColor' });
    if (saved.value) {
      this.backgroundColorSubject.next(saved.value);
    }
  }

  async setBackgroundColor(color: string) {
    this.backgroundColorSubject.next(color);
    await Preferences.set({ key: 'backgroundColor', value: color });
  }

  getBackgroundColor(): string {
    return this.backgroundColorSubject.getValue();
  }

  getTextColor(backgroundColor?: string): string {
    const bgColor = backgroundColor || this.getBackgroundColor();
    
    // Convert hex to RGB
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for light backgrounds, white for dark backgrounds
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  // Notes management
  async getNotes(): Promise<any[]> {
    const saved = await Preferences.get({ key: 'notes' });
    if (saved.value) {
      return JSON.parse(saved.value);
    }
    return [];
  }

  async addNote(note: any) {
    const notes = await this.getNotes();
    notes.unshift(note); // Add to beginning
    await Preferences.set({ key: 'notes', value: JSON.stringify(notes) });
  }

  async updateNote(updatedNote: any) {
    const notes = await this.getNotes();
    const index = notes.findIndex(n => n.id === updatedNote.id);
    if (index !== -1) {
      notes[index] = updatedNote;
      await Preferences.set({ key: 'notes', value: JSON.stringify(notes) });
    }
  }

  async deleteNote(noteId: string) {
    const notes = await this.getNotes();
    const filteredNotes = notes.filter(n => n.id !== noteId);
    await Preferences.set({ key: 'notes', value: JSON.stringify(filteredNotes) });
  }

  ngOnDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}
