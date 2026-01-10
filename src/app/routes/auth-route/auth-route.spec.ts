import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthRoute } from './auth-route';

describe('AuthRoute', () => {
  let component: AuthRoute;
  let fixture: ComponentFixture<AuthRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthRoute]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthRoute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
