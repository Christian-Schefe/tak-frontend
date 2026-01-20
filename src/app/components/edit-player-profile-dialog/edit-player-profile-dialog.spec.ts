import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPlayerProfileDialog } from './edit-player-profile-dialog';

describe('EditPlayerProfileDialog', () => {
  let component: EditPlayerProfileDialog;
  let fixture: ComponentFixture<EditPlayerProfileDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPlayerProfileDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditPlayerProfileDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
