import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotFoundRoute } from './not-found-route';

describe('NotFoundRoute', () => {
  let component: NotFoundRoute;
  let fixture: ComponentFixture<NotFoundRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundRoute]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotFoundRoute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
