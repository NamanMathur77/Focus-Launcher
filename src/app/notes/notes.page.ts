import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonFab,
  IonFabButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButtons,
  IonButton,
  ModalController,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, trash, create } from 'ionicons/icons';
import { AppState } from '../services/app-state';
import { NoteEditorComponent } from './note-editor/note-editor.component';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

@Component({
  selector: 'app-notes',
  templateUrl: './notes.page.html',
  styleUrls: ['./notes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonFab,
    IonFabButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButtons,
    IonButton
  ]
})
export class NotesPage implements OnInit {
  notes: Note[] = [];
  backgroundColor$ = this.appState.backgroundColor$;

  constructor(
    private appState: AppState,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({ add, trash, create });
  }

  async ngOnInit() {
    await this.loadNotes();
  }

  async loadNotes() {
    this.notes = await this.appState.getNotes();
  }

  async addNote() {
    const modal = await this.modalCtrl.create({
      component: NoteEditorComponent,
      componentProps: {
        isEdit: false
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      const note: Note = {
        id: Date.now().toString(),
        title: data.title,
        content: data.content,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await this.appState.addNote(note);
      await this.loadNotes();
      
      const toast = await this.toastCtrl.create({
        message: 'Note added',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    }
  }

  async editNote(note: Note) {
    const modal = await this.modalCtrl.create({
      component: NoteEditorComponent,
      componentProps: {
        note: note,
        isEdit: true
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      const updatedNote: Note = {
        ...note,
        title: data.title,
        content: data.content,
        updatedAt: Date.now()
      };
      await this.appState.updateNote(updatedNote);
      await this.loadNotes();
      
      const toast = await this.toastCtrl.create({
        message: 'Note updated',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    }
  }

  async deleteNote(note: Note) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Note',
      message: 'Are you sure you want to delete this note?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.appState.deleteNote(note.id);
            await this.loadNotes();
            
            const toast = await this.toastCtrl.create({
              message: 'Note deleted',
              duration: 2000,
              color: 'warning',
              position: 'top'
            });
            await toast.present();
          }
        }
      ]
    });

    await alert.present();
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  getTextColor(backgroundColor: string | null): string {
    return this.appState.getTextColor(backgroundColor || undefined);
  }
}
