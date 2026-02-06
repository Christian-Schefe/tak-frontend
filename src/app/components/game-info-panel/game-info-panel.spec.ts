import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameInfoPanel } from './game-info-panel';

describe('GameInfoPanel', () => {
  let component: GameInfoPanel;
  let fixture: ComponentFixture<GameInfoPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameInfoPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameInfoPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
