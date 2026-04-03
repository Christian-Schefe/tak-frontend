import { Component, computed, input } from '@angular/core';

export interface EvalVariation {
  evaluation: number;
  moves: string[];
}

@Component({
  selector: 'app-game-analysis-bar',
  imports: [],
  templateUrl: './game-analysis-bar.html',
  styleUrl: './game-analysis-bar.css',
})
export class GameAnalysisBar {
  variations = input.required<EvalVariation[]>();

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
