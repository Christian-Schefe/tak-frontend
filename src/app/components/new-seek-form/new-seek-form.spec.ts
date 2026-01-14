import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewSeekForm } from './new-seek-form';

describe('NewSeekForm', () => {
  let component: NewSeekForm;
  let fixture: ComponentFixture<NewSeekForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewSeekForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewSeekForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
