import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerLabel } from './player-label';

describe('PlayerLabel', () => {
  let component: PlayerLabel;
  let fixture: ComponentFixture<PlayerLabel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerLabel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerLabel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
