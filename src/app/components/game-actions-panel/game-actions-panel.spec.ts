import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameActionsPanel } from './game-actions-panel';

describe('GameActionsPanel', () => {
  let component: GameActionsPanel;
  let fixture: ComponentFixture<GameActionsPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameActionsPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameActionsPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
