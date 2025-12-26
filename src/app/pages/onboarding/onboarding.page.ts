import { Component} from '@angular/core';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { AppLauncher } from '../../native/app-launcher';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonButton } from '@ionic/angular/standalone';

const ONBOARDING_KEY = 'onboarding_completed';
@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, IonButton]
})
export class OnboardingPage{

  constructor(private router: Router) {}

  async enableFocusMode() {
    // mark onboarding done
    await Preferences.set({
      key: ONBOARDING_KEY,
      value: 'true',
    });

    // open launcher chooser
    try {
      await AppLauncher.openLauncherChooser();
    } catch (e) {
      console.error('Failed to open launcher chooser', e);
    }

    // Navigate to our app's Settings screen so when the user returns they'll
    // be at the place to configure the launcher-specific settings.
    this.router.navigateByUrl('/settings', { replaceUrl: true });
  }

}
