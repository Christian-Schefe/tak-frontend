import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnlinePlayRoute } from './online-play-route';

describe('OnlinePlayRoute', () => {
  let component: OnlinePlayRoute;
  let fixture: ComponentFixture<OnlinePlayRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnlinePlayRoute]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OnlinePlayRoute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
