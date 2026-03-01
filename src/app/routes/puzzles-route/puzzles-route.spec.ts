import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PuzzlesRoute } from './puzzles-route';

describe('PuzzlesRoute', () => {
  let component: PuzzlesRoute;
  let fixture: ComponentFixture<PuzzlesRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PuzzlesRoute]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PuzzlesRoute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
