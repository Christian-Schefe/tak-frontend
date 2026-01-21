import { Component, computed, inject, input, output, signal } from '@angular/core';
import { TakPieceId, TakPieceVariant, TakPos } from '../../../../tak-core';
import { GameMode, TakActionEvent } from '../../game-component/game-component';
import { TakGameUI, TakUITile } from '../../../../tak-core/ui';
import { BoardPiece } from '../board-piece/board-piece';
import { BoardTile } from '../board-tile/board-tile';
import { SettingsService } from '../../../services/settings-service/settings-service';
import { defaultTheme, ThemeParams, themes } from '../../../../2d-themes';

export interface BoardSettings {
  theme: ThemeParams;
  axisLabels: boolean;
  axisLabelSize: number;
}

@Component({
  selector: 'app-board-native-component',
  imports: [BoardPiece, BoardTile],
  templateUrl: './board-native-component.html',
  styleUrl: './board-native-component.css',
})
export class BoardNativeComponent {
  game = input.required<TakGameUI>();
  action = output<TakActionEvent>();
  mode = input.required<GameMode>();
  settingsService = inject(SettingsService);

  boardSettings = computed<BoardSettings>(() => {
    const settings = this.settingsService.boardNativeSettings();
    const theme = themes[settings.theme] || defaultTheme;
    return { theme, axisLabels: true, axisLabelSize: 14 };
  });

  currentVariant = signal<TakPieceVariant>('flat');

  gameSettings = computed(() => {
    return this.game().actualGame.settings;
  });

  private tiles = computed(() => this.game().tiles);

  tilePositions = computed(() => {
    const tiles = this.tiles();
    const gameSettings = this.gameSettings();
    const tileData: { pos: TakPos; data: TakUITile }[] = [];
    for (let y = gameSettings.boardSize - 1; y >= 0; y--) {
      for (let x = 0; x < gameSettings.boardSize; x++) {
        tileData.push({ pos: { x, y }, data: tiles[y][x] });
      }
    }
    return tileData;
  });

  pieces = computed(() => this.game().pieces);

  pieceIds = computed(() => {
    const pieces = this.pieces();
    const pieceIds = Object.entries(pieces)
      .map(([id, data]) =>
        data
          ? {
              id: id as TakPieceId,
              data,
            }
          : null,
      )
      .filter(filterTruthy);
    pieceIds.sort((a, b) => a.id.localeCompare(b.id));
    return pieceIds;
  });

  onClickTile(pos: TakPos) {
    this.action.emit({ type: 'partial', pos, variant: this.currentVariant() });
    return;
    this.currentVariant.update((v) =>
      v === 'flat' ? 'standing' : v === 'standing' ? 'capstone' : 'flat',
    );
  }
}

function filterTruthy<T>(val: T | undefined | null): val is T {
  return !!val;
}
