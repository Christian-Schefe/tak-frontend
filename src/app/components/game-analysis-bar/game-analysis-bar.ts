import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { EngineService } from '../../services/engine-service/engine-service';
import { getShownGame, TakGameUI } from '../../../tak-core/ui';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';

export interface EvalVariation {
  evaluation: number;
  moves: string[];
}
const engineKey = 'analysis-worker';

@Component({
  selector: 'app-game-analysis-bar',
  imports: [ToggleSwitchModule, FormsModule],
  templateUrl: './game-analysis-bar.html',
  styleUrl: './game-analysis-bar.css',
})
export class GameAnalysisBar implements OnInit {
  private engineService = inject(EngineService);
  private hasLoaded = signal(false);

  game = input.required<TakGameUI>();

  variations = signal<EvalVariation[]>([]);
  evaluationSupported = signal<null | boolean>(null);
  enabled = signal(true);

  isEvaluationSupported = computed(() => {
    return this.evaluationSupported() === true && this.shownGame().gameState.type === 'ongoing';
  });

  showEvaluation = computed(() => {
    return this.enabled() && this.isEvaluationSupported();
  });

  ngOnInit() {
    void this.onInit();
  }

  private async onInit() {
    console.log('Initializing game analysis bar...');
    await this.engineService.initialize(engineKey, (message) => {
      if (message.type === 'evaluation') {
        this.variations.set(message.variations);
      } else {
        this.evaluationSupported.set(message.supported);
      }
    });
    this.hasLoaded.set(true);
  }

  shownGame = computed(() => {
    return getShownGame(this.game());
  });

  private _updateEffect = effect(() => {
    if (!this.hasLoaded()) {
      return;
    }
    const game = this.shownGame();
    if (game.gameState.type !== 'ongoing') {
      void this.engineService.stop(engineKey);
      console.log('Game is not ongoing, stopping engine.');
      return;
    }
    void this.engineService.checkSettings(engineKey, game);
    const supported = this.evaluationSupported();
    if (supported === null) {
      console.log('Evaluation support not yet determined, waiting...');
      return;
    }
    if (!supported || !this.enabled()) {
      void this.engineService.stop(engineKey);
      console.log('Evaluation not supported or disabled, stopping engine.');
    } else {
      void this.engineService.evaluatePosition(engineKey, game);
      console.log('Evaluating position...');
    }
  });

  adjustedVariations = computed(() => {
    return this.variations().map((variation) => ({
      ...variation,
      displayMoves: variation.moves.slice(0, 12).join(' '),
      displayEvaluation:
        (variation.evaluation > 0 ? '+' : variation.evaluation < 0 ? '-' : '') +
        (Math.abs(variation.evaluation) / 10).toFixed(1),
    }));
  });
}
