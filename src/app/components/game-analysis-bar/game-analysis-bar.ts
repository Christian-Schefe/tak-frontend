import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-game-analysis-bar',
  imports: [DecimalPipe],
  templateUrl: './game-analysis-bar.html',
  styleUrl: './game-analysis-bar.css',
})
export class GameAnalysisBar {
  evaluation = input.required<number>();

  adjustedEvaluation = computed(() => {
    const evalValue = this.evaluation(); // [-100; 100]
    return evalValue * 0.5 + 50; // [0; 100]
  });
  displayEvaluation = computed(() => {
    const evalValue = this.evaluation(); // [-100; 100]
    return Math.abs(evalValue) / 10; // [0; 10]
  });
}
