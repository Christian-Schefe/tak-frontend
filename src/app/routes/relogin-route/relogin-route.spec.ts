import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReloginRoute } from './relogin-route';

describe('ReloginRoute', () => {
  let component: ReloginRoute;
  let fixture: ComponentFixture<ReloginRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReloginRoute]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReloginRoute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
