import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountSettingsRoute } from './account-settings-route';

describe('AccountSettingsRoute', () => {
  let component: AccountSettingsRoute;
  let fixture: ComponentFixture<AccountSettingsRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountSettingsRoute]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountSettingsRoute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
