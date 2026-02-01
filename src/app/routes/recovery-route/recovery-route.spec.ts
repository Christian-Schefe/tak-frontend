import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecoveryRoute } from './recovery-route';

describe('RecoveryRoute', () => {
  let component: RecoveryRoute;
  let fixture: ComponentFixture<RecoveryRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecoveryRoute],
    }).compileComponents();

    fixture = TestBed.createComponent(RecoveryRoute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
