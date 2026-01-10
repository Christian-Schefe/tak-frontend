import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificationRoute } from './verification-route';

describe('VerificationRoute', () => {
  let component: VerificationRoute;
  let fixture: ComponentFixture<VerificationRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificationRoute],
    }).compileComponents();

    fixture = TestBed.createComponent(VerificationRoute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
