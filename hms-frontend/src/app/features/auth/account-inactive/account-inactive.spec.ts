import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountInactive } from './account-inactive';

describe('AccountInactive', () => {
  let component: AccountInactive;
  let fixture: ComponentFixture<AccountInactive>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountInactive],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountInactive);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
