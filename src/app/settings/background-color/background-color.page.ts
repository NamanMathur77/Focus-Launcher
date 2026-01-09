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
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio
} from '@ionic/angular/standalone';
import { AppState } from '../../services/app-state';

@Component({
  selector: 'app-background-color',
  templateUrl: './background-color.page.html',
  styleUrls: ['./background-color.page.scss'],
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
    IonItem,
    IonLabel,
    IonRadioGroup,
    IonRadio
  ]
})
export class BackgroundColorPage implements OnInit {
  
  selectedColor: string = '#000000';
  backgroundColor$ = this.appState.backgroundColor$;

  colors = [
    { name: 'Black', value: '#000000' },
    { name: 'Dark Gray', value: '#1a1a1a' },
    { name: 'Dark Blue', value: '#0d1b2a' },
    { name: 'Dark Purple', value: '#1a0033' },
    { name: 'Dark Green', value: '#0a2e0f' },
    { name: 'Dark Red', value: '#2e0a0a' },
    { name: 'Navy Blue', value: '#001f3f' },
    { name: 'Charcoal', value: '#36454f' },
    { name: 'White', value: '#ffffff' },
    { name: 'Light Gray', value: '#f5f5f5' },
    { name: 'Beige', value: '#f5f5dc' },
    { name: 'Light Blue', value: '#e3f2fd' },
    { name: 'Light Green', value: '#e8f5e9' },
    { name: 'Light Pink', value: '#fce4ec' }
  ];

  constructor(
    private appState: AppState,
    private router: Router
  ) {}

  async ngOnInit() {
    this.selectedColor = this.appState.getBackgroundColor();
  }

  async onColorChange(event: any) {
    const color = event.detail.value;
    this.selectedColor = color;
    await this.appState.setBackgroundColor(color);
  }

  getTextColor(backgroundColor: string | null): string {
    return this.appState.getTextColor(backgroundColor || undefined);
  }
}
