import { Component, computed, input } from '@angular/core';
import { TakGameState } from '../../../tak-core';
import { gameResultToString } from '../../../tak-core/game';

@Component({
  selector: 'app-game-analysis-bar',
  imports: [],
  templateUrl: './game-analysis-bar.html',
  styleUrl: './game-analysis-bar.css',
})
export class GameAnalysisBar {
  evaluation = input.required<number>();
  gameState = input.required<TakGameState>();

  adjustedEvaluation = computed(() => {
    const gameState = this.gameState();
    if (gameState.type === 'win') {
      return gameState.player === 'white' ? 100 : 0;
    } else if (gameState.type !== 'ongoing') {
      return 50;
    }

    const evalValue = this.evaluation(); // [-100; 100]
    return evalValue * 0.5 + 50; // [0; 100]
  });
  displayEvaluation = computed(() => {
    const gameState = this.gameState();
    if (gameState.type !== 'ongoing') {
      const gameStateStr = gameResultToString(gameState);
      return gameStateStr ?? '';
    }
    const evalValue = this.evaluation(); // [-100; 100]
    const val = Math.abs(evalValue) / 10; // [0; 10]
    return val.toFixed(1);
  });
}
