import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardPiece } from './board-piece';

describe('BoardPiece', () => {
  let component: BoardPiece;
  let fixture: ComponentFixture<BoardPiece>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardPiece]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardPiece);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
