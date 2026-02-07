import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamesRoute } from './games-route';

describe('GamesRoute', () => {
  let component: GamesRoute;
  let fixture: ComponentFixture<GamesRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamesRoute],
    }).compileComponents();

    fixture = TestBed.createComponent(GamesRoute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
