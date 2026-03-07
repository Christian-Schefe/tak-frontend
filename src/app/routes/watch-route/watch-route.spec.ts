import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WatchRoute } from './watch-route';

describe('WatchRoute', () => {
  let component: WatchRoute;
  let fixture: ComponentFixture<WatchRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WatchRoute],
    }).compileComponents();

    fixture = TestBed.createComponent(WatchRoute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
