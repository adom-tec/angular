import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SuspendVisitsDialogComponent } from './suspend-visits-dialog.component';

describe('SuspendVisitsDialogComponent', () => {
  let component: SuspendVisitsDialogComponent;
  let fixture: ComponentFixture<SuspendVisitsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SuspendVisitsDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SuspendVisitsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
