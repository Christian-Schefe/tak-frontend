import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountRoute } from './account-route';

describe('AccountRoute', () => {
  let component: AccountRoute;
  let fixture: ComponentFixture<AccountRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountRoute]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountRoute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
