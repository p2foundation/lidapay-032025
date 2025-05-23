import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuyReloadlyPage } from './buy-reloadly.page';

describe('BuyReloadlyPage', () => {
  let component: BuyReloadlyPage;
  let fixture: ComponentFixture<BuyReloadlyPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyReloadlyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
