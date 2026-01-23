import { Component, input, output } from '@angular/core';
import { TakGameUI } from '../../../../tak-core/ui';
import { GameMode, TakActionEvent } from '../../game-component/game-component';
import { NgtCanvasContent, NgtCanvasImpl } from 'angular-three/dom';
import { BoardNgtCanvas } from '../board-ngt-canvas/board-ngt-canvas';

@Component({
  selector: 'app-board-ngt-component',
  imports: [NgtCanvasImpl, BoardNgtCanvas, NgtCanvasContent],
  templateUrl: './board-ngt-component.html',
  styleUrl: './board-ngt-component.css',
})
export class BoardNgtComponent {
  game = input.required<TakGameUI>();
  action = output<TakActionEvent>();
  mode = input.required<GameMode>();
}
