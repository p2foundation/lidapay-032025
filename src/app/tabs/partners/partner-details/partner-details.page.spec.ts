import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PartnerDetailsPage } from './partner-details.page';

describe('PartnerDetailsPage', () => {
  let component: PartnerDetailsPage;
  let fixture: ComponentFixture<PartnerDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PartnerDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
