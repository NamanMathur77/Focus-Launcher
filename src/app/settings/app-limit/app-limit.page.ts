import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio
} from '@ionic/angular/standalone';
import { AppState } from '../../services/app-state';

@Component({
  selector: 'app-app-limit',
  templateUrl: './app-limit.page.html',
  styleUrls: ['./app-limit.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonRadioGroup,
    IonRadio
  ]
})
export class AppLimitPage implements OnInit {
  
  selectedLimit: number = 7;
  limitOptions = [3, 5, 7, 10, 15, 20, 25, 30];
  backgroundColor$ = this.appState.backgroundColor$;

  constructor(
    private appState: AppState,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.appState.loadSelectionLimit();
    this.selectedLimit = this.appState.getSelectionLimit();
  }

  async onLimitChange(event: any) {
    const limit = event.detail.value;
    this.selectedLimit = limit;
    await this.appState.setSelectionLimit(limit);
  }

  getTextColor(backgroundColor: string | null): string {
    return this.appState.getTextColor(backgroundColor || undefined);
  }
}
