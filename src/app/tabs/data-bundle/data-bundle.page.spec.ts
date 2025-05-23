import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataBundlePage } from './data-bundle.page';

describe('DataBundlePage', () => {
  let component: DataBundlePage;
  let fixture: ComponentFixture<DataBundlePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DataBundlePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
