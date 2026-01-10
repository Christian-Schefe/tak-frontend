import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeRoute } from './home-route';

describe('HomeRoute', () => {
  let component: HomeRoute;
  let fixture: ComponentFixture<HomeRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeRoute]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeRoute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
