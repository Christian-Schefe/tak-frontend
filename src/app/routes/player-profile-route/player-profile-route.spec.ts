import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerProfileRoute } from './player-profile-route';

describe('PlayerProfileRoute', () => {
  let component: PlayerProfileRoute;
  let fixture: ComponentFixture<PlayerProfileRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerProfileRoute],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerProfileRoute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
