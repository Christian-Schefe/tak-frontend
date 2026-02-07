import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeeksTableComponent } from './seeks-table-component';

describe('SeeksTableComponent', () => {
  let component: SeeksTableComponent;
  let fixture: ComponentFixture<SeeksTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeeksTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SeeksTableComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
