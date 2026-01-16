import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameClock } from './game-clock';

describe('GameClock', () => {
  let component: GameClock;
  let fixture: ComponentFixture<GameClock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameClock]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameClock);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
