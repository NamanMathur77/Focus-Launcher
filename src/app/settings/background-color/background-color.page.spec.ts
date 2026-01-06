import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackgroundColorPage } from './background-color.page';

describe('BackgroundColorPage', () => {
  let component: BackgroundColorPage;
  let fixture: ComponentFixture<BackgroundColorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BackgroundColorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
