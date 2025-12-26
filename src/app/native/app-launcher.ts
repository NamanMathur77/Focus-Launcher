import { registerPlugin } from '@capacitor/core';

export interface InstalledApp {
  appName: string;
  packageName: string;
}

export interface AppLauncherPlugin {
  getInstalledApps(): Promise<{ apps: InstalledApp[] }>;
  openApp(options: { packageName: string }): Promise<void>;

  openLauncherChooser(): Promise<void>;
}

export const AppLauncher = registerPlugin<AppLauncherPlugin>('AppLauncherCustom');