import { TestBed } from '@angular/core/testing';

import { GameAudioService } from './game-audio-service';

describe('GameAudioService', () => {
  let service: GameAudioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameAudioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
