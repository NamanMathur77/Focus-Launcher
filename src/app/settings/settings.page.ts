import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonList,
    IonItem,
    IonLabel
]
})
export class SettingsPage implements OnInit {

  constructor(private router: Router) { }

  async ngOnInit() {
    console.log('SettingsPage loaded');
  }

  navigateToAppSettings() {
    this.router.navigate(['/settings/app-settings']);
  }
}