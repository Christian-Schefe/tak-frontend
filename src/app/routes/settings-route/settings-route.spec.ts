import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsRoute } from './settings-route';

describe('SettingsRoute', () => {
  let component: SettingsRoute;
  let fixture: ComponentFixture<SettingsRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsRoute]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingsRoute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
