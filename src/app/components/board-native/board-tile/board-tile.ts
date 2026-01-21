import { Component, computed, input, output } from '@angular/core';
import { TakUITile } from '../../../../tak-core/ui';
import { BoardSettings } from '../board-native-component/board-native-component';
import { TakGameSettings, TakGameState } from '../../../../tak-core';
import Color from 'colorjs.io';

@Component({
  selector: 'app-board-tile',
  imports: [],
  templateUrl: './board-tile.html',
  styleUrl: './board-tile.css',
})
export class BoardTile {
  x = input.required<number>();
  y = input.required<number>();
  interactive = input.required<boolean>();
  data = input.required<TakUITile>();
  settings = input.required<TakGameSettings>();
  tileClick = output<void>();
  gameState = input.required<TakGameState>();
  plyIndex = input.required<number | null>();

  boardSettings = input.required<BoardSettings>();

  opacityTransitionStr = computed(() => `opacity 200ms ease-in-out`);

  xChar = computed(() => String.fromCharCode('A'.charCodeAt(0) + this.x()).toUpperCase());

  colorIndex = computed(() => {
    const x = this.x();
    const y = this.y();
    const isEven = (x + y) % 2 === 0;
    const size = this.settings().boardSize;
    const ringCount = Math.ceil(size / 2);
    const ringIndex = Math.min(x, y, size - 1 - x, size - 1 - y) / (ringCount - 1);
    const themeParams = this.boardSettings().theme;
    switch (themeParams.board.tiling) {
      case 'checkerboard':
        return isEven ? 0 : 1;
      case 'rings':
        return ringIndex;
      case 'linear':
        return (x + y) / (2 * (size - 1));
      case 'random': {
        const seed = (x * 73856093) ^ (y * 19349663);
        const rand = ((seed % 1000) + 1000) % 1000;
        return rand / 1000;
      }
      default:
        return 0;
    }
  });

  specialHighlight = computed(() => {
    const plyIndex = this.plyIndex();
    const gameState = this.gameState();
    const x = this.x();
    const y = this.y();
    const isRoad =
      plyIndex === null &&
      gameState.type === 'win' &&
      gameState.reason === 'road' &&
      gameState.road?.some((coord) => coord.x === x && coord.y === y) === true;

    const isFlatWin =
      plyIndex === null &&
      gameState.type === 'win' &&
      gameState.reason === 'flats' &&
      gameState.flats?.some((coord) => coord.x === x && coord.y === y) === true;

    return isRoad || isFlatWin;
  });

  isHover = computed(() => this.interactive() && this.data().hoverable);

  bgColor = computed(() => {
    const colorIndex = this.colorIndex();
    const themeParams = this.boardSettings().theme;
    const backgroundColorEven = new Color(themeParams.board1);
    const backgroundColorOdd = new Color(themeParams.board2);

    return backgroundColorEven.mix(backgroundColorOdd, colorIndex);
  });
}
