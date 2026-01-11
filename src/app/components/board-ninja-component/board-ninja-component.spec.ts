import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardNinjaComponent } from './board-ninja-component';

describe('BoardNinjaComponent', () => {
  let component: BoardNinjaComponent;
  let fixture: ComponentFixture<BoardNinjaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardNinjaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardNinjaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
