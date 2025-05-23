import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConditionPage } from './condition.page';

describe('ConditionPage', () => {
  let component: ConditionPage;
  let fixture: ComponentFixture<ConditionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConditionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
