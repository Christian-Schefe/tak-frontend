import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamesDialogComponent } from './games-dialog-component';

describe('GamesDialogComponent', () => {
  let component: GamesDialogComponent;
  let fixture: ComponentFixture<GamesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamesDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamesDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
