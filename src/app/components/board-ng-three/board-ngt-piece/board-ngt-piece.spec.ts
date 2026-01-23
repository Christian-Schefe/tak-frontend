import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardNgtPiece } from './board-ngt-piece';

describe('BoardNgtPiece', () => {
  let component: BoardNgtPiece;
  let fixture: ComponentFixture<BoardNgtPiece>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardNgtPiece]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardNgtPiece);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
