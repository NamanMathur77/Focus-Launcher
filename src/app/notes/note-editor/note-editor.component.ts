import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonTextarea,
  IonInput,
  IonIcon,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, checkmark } from 'ionicons/icons';
import { Note } from '../notes.page';

@Component({
  selector: 'app-note-editor',
  templateUrl: './note-editor.component.html',
  styleUrls: ['./note-editor.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonTextarea,
    IonInput,
    IonIcon
  ]
})
export class NoteEditorComponent implements OnInit {
  @Input() note?: Note;
  @Input() isEdit: boolean = false;

  title: string = '';
  content: string = '';

  constructor(private modalCtrl: ModalController) {
    addIcons({ close, checkmark });
  }

  ngOnInit() {
    if (this.note) {
      this.title = this.note.title;
      this.content = this.note.content;
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  save() {
    if (this.title.trim() && this.content.trim()) {
      this.modalCtrl.dismiss({
        title: this.title,
        content: this.content
      });
    }
  }
}
