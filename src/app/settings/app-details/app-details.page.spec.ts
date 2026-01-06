import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppDetailsPage } from './app-details.page';

describe('AppDetailsPage', () => {
  let component: AppDetailsPage;
  let fixture: ComponentFixture<AppDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AppDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
