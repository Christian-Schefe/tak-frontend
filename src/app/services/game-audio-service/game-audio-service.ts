import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GameAudioService {
  private moveAudio = new Audio('/audio/move.ogg');

  playMoveSound(): void {
    this.moveAudio.currentTime = 0;
    void this.moveAudio.play();
  }
}
