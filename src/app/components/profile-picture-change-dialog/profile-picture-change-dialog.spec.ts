import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilePictureChangeDialog } from './profile-picture-change-dialog';

describe('ProfilePictureChangeDialog', () => {
  let component: ProfilePictureChangeDialog;
  let fixture: ComponentFixture<ProfilePictureChangeDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePictureChangeDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfilePictureChangeDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
