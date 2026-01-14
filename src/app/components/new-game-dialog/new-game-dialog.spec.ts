import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewGameDialog } from './new-game-dialog';

describe('NewGameDialog', () => {
  let component: NewGameDialog;
  let fixture: ComponentFixture<NewGameDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewGameDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewGameDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
