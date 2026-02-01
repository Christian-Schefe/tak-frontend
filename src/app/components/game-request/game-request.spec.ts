import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameRequest } from './game-request';

describe('GameRequest', () => {
  let component: GameRequest;
  let fixture: ComponentFixture<GameRequest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameRequest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameRequest);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
