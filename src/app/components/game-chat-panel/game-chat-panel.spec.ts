import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameChatPanel } from './game-chat-panel';

describe('GameChatPanel', () => {
  let component: GameChatPanel;
  let fixture: ComponentFixture<GameChatPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameChatPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameChatPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
