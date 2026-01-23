import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardNgtCanvas } from './board-ngt-canvas';

describe('BoardNgtCanvas', () => {
  let component: BoardNgtCanvas;
  let fixture: ComponentFixture<BoardNgtCanvas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardNgtCanvas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardNgtCanvas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
