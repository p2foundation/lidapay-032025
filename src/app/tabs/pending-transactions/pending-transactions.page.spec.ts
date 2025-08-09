import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PendingTransactionsPage } from './pending-transactions.page';

describe('PendingTransactionsPage', () => {
  let component: PendingTransactionsPage;
  let fixture: ComponentFixture<PendingTransactionsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingTransactionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
