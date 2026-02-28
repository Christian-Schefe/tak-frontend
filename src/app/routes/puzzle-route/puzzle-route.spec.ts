import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PuzzleRoute } from './puzzle-route';

describe('PuzzleRoute', () => {
  let component: PuzzleRoute;
  let fixture: ComponentFixture<PuzzleRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PuzzleRoute]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PuzzleRoute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
