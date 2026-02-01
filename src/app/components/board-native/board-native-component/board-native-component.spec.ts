import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardNativeComponent } from './board-native-component';

describe('BoardNativeComponent', () => {
  let component: BoardNativeComponent;
  let fixture: ComponentFixture<BoardNativeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardNativeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardNativeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
