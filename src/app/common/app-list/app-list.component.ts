import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonToggle
} from '@ionic/angular/standalone';
import { InstalledApp } from '../../native/app-launcher';

@Component({
  selector: 'app-app-list',
  standalone: true,
  imports: [CommonModule, IonList, IonItem, IonLabel, IonCheckbox, IonToggle],
  templateUrl: './app-list.component.html',
  styleUrls: ['./app-list.component.scss'],
})
export class AppListComponent {

  @Input() apps: InstalledApp[] = [];

  // Settings mode
  @Input() selectable = false;
  @Input() selected = new Set<string>();

  @Output() selectionChange = new EventEmitter<Set<string>>();

  /** Emitted when a single app toggle is changed. Includes the original event so
   *  parent can revert the toggle visually if the change is rejected. */
  @Output() toggleRequest = new EventEmitter<{ pkg: string; checked: boolean; event?: Event }>();

  // Home mode
  @Output() appClick = new EventEmitter<InstalledApp>();

  toggle(pkg: string, checked: boolean, event?: Event) {
    const next = new Set(this.selected);
    checked ? next.add(pkg) : next.delete(pkg);
    // Emit a toggleRequest for the parent to process; parent may also accept the full set via selectionChange
    this.toggleRequest.emit({ pkg, checked, event });
  }

  onClick(app: InstalledApp) {
    if (this.selectable) return;
    this.appClick.emit(app);
  }
}
