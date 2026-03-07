import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayRoute } from './play-route';

describe('PlayRoute', () => {
  let component: PlayRoute;
  let fixture: ComponentFixture<PlayRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayRoute],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayRoute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
