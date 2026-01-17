import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameSidePanel } from './game-side-panel';

describe('GameSidePanel', () => {
  let component: GameSidePanel;
  let fixture: ComponentFixture<GameSidePanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameSidePanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameSidePanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
