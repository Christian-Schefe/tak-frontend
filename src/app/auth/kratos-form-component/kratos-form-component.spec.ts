import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KratosFormComponent } from './kratos-form-component';

describe('KratosFormComponent', () => {
  let component: KratosFormComponent;
  let fixture: ComponentFixture<KratosFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KratosFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KratosFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
