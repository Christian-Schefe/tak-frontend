import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalPlayRoute } from './local-play-route';

describe('LocalPlayRoute', () => {
  let component: LocalPlayRoute;
  let fixture: ComponentFixture<LocalPlayRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocalPlayRoute]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocalPlayRoute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
