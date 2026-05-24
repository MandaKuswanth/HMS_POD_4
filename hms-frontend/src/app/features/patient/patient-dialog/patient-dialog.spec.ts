import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientDialog } from './patient-dialog';

describe('PatientDialog', () => {
  let component: PatientDialog;
  let fixture: ComponentFixture<PatientDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
