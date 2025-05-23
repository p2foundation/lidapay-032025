import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileUpdatePage } from './profile-update.page';

describe('ProfileUpdatePage', () => {
  let component: ProfileUpdatePage;
  let fixture: ComponentFixture<ProfileUpdatePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileUpdatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
