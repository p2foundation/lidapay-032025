import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PayOrSendPage } from './pay-or-send.page';

describe('PayOrSendPage', () => {
  let component: PayOrSendPage;
  let fixture: ComponentFixture<PayOrSendPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PayOrSendPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
