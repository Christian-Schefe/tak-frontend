import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KratosInputComponent } from './kratos-input-component';

describe('KratosInputComponent', () => {
  let component: KratosInputComponent;
  let fixture: ComponentFixture<KratosInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KratosInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KratosInputComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
