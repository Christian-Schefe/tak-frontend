import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewLocalForm } from './new-local-form';

describe('NewLocalForm', () => {
  let component: NewLocalForm;
  let fixture: ComponentFixture<NewLocalForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewLocalForm],
    }).compileComponents();

    fixture = TestBed.createComponent(NewLocalForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
