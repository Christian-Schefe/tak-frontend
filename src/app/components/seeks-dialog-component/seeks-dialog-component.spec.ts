import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeeksDialogComponent } from './seeks-dialog-component';

describe('SeeksDialogComponent', () => {
  let component: SeeksDialogComponent;
  let fixture: ComponentFixture<SeeksDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeeksDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SeeksDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
