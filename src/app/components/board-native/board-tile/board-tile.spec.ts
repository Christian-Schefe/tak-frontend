import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardTile } from './board-tile';

describe('BoardTile', () => {
  let component: BoardTile;
  let fixture: ComponentFixture<BoardTile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardTile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardTile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
