import { TestBed } from '@angular/core/testing';

import { SeekService } from './seek-service';

describe('SeekService', () => {
  let service: SeekService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeekService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
