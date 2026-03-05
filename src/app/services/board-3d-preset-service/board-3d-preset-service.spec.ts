import { TestBed } from '@angular/core/testing';

import { Board3dPresetService } from './board-3d-preset-service';

describe('Board3dPresetService', () => {
  let service: Board3dPresetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Board3dPresetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
