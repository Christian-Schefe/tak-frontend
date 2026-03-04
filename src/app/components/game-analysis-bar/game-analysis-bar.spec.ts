import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameAnalysisBar } from './game-analysis-bar';

describe('GameAnalysisBar', () => {
  let component: GameAnalysisBar;
  let fixture: ComponentFixture<GameAnalysisBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameAnalysisBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameAnalysisBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
