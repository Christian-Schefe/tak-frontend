import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardNgtComponent } from './board-ngt-component';

describe('BoardNgtComponent', () => {
  let component: BoardNgtComponent;
  let fixture: ComponentFixture<BoardNgtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardNgtComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardNgtComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
