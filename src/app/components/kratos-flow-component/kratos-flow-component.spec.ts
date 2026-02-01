import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KratosFlowComponent } from './kratos-flow-component';

describe('KratosFlowComponent', () => {
  let component: KratosFlowComponent;
  let fixture: ComponentFixture<KratosFlowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KratosFlowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KratosFlowComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
