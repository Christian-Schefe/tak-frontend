import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamePlayerLabel } from './game-player-label';

describe('GamePlayerLabel', () => {
  let component: GamePlayerLabel;
  let fixture: ComponentFixture<GamePlayerLabel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamePlayerLabel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamePlayerLabel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
