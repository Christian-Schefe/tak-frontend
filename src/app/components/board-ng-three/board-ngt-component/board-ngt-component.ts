import { Component, input, output, signal } from '@angular/core';
import { TakGameUI } from '../../../../tak-core/ui';
import { GameMode, TakActionEvent } from '../../game-component/game-component';
import { NgtCanvasContent, NgtCanvasImpl } from 'angular-three/dom';
import { BoardNgtCanvas } from '../board-ngt-canvas/board-ngt-canvas';
import { progress } from 'angular-three-soba/loaders';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-board-ngt-component',
  imports: [NgtCanvasImpl, BoardNgtCanvas, NgtCanvasContent, ProgressBarModule],
  templateUrl: './board-ngt-component.html',
  styleUrl: './board-ngt-component.css',
})
export class BoardNgtComponent {
  game = input.required<TakGameUI>();
  action = output<TakActionEvent>();
  mode = input.required<GameMode>();

  loadingState = progress();

  show = signal(false);

  constructor() {
    setTimeout(() => {
      this.show.set(true);
    }, 500);
  }
}
