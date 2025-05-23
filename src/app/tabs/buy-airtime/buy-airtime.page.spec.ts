import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuyAirtimePage } from './buy-airtime.page';

describe('BuyAirtimePage', () => {
  let component: BuyAirtimePage;
  let fixture: ComponentFixture<BuyAirtimePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyAirtimePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
