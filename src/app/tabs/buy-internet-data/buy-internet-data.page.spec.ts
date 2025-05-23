import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuyInternetDataPage } from './buy-internet-data.page';

describe('BuyInternetDataPage', () => {
  let component: BuyInternetDataPage;
  let fixture: ComponentFixture<BuyInternetDataPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyInternetDataPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
