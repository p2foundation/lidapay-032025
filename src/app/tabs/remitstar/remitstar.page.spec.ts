import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RemitstarPage } from './remitstar.page';

describe('RemitstarPage', () => {
  let component: RemitstarPage;
  let fixture: ComponentFixture<RemitstarPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RemitstarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
