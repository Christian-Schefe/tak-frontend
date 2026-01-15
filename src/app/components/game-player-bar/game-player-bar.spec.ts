import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamePlayerBar } from './game-player-bar';

describe('GamePlayerBar', () => {
  let component: GamePlayerBar;
  let fixture: ComponentFixture<GamePlayerBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamePlayerBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamePlayerBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
