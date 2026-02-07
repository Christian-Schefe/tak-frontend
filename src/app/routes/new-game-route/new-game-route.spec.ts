import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewGameRoute } from './new-game-route';

describe('NewGameRoute', () => {
  let component: NewGameRoute;
  let fixture: ComponentFixture<NewGameRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewGameRoute]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewGameRoute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
