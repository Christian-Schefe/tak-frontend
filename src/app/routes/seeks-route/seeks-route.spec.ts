import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeeksRoute } from './seeks-route';

describe('SeeksRoute', () => {
  let component: SeeksRoute;
  let fixture: ComponentFixture<SeeksRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeeksRoute]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeeksRoute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
