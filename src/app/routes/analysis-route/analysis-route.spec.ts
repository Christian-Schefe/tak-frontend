import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisRoute } from './analysis-route';

describe('AnalysisRoute', () => {
  let component: AnalysisRoute;
  let fixture: ComponentFixture<AnalysisRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalysisRoute]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnalysisRoute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
