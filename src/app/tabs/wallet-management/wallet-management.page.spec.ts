import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WalletManagementPage } from './wallet-management.page';

describe('WalletManagementPage', () => {
  let component: WalletManagementPage;
  let fixture: ComponentFixture<WalletManagementPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(WalletManagementPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
