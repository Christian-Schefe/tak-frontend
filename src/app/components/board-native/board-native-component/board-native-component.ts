import { Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { TakPieceId, TakPieceVariant, TakPlayer, TakPos } from '../../../../tak-core';
import { GameMode, TakActionEvent } from '../../game-component/game-component';
import { TakGameUI, TakUITile } from '../../../../tak-core/ui';
import { BoardPiece } from '../board-piece/board-piece';
import { BoardTile } from '../board-tile/board-tile';
import { SettingsService } from '../../../services/settings-service/settings-service';
import { defaultTheme, ThemeParams, themes } from '../../../../2d-themes';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { filterTruthy } from '../../../util';

export interface BoardSettings {
  theme: ThemeParams;
  axisLabels: boolean;
  axisLabelSize: number;
}

@Component({
  selector: 'app-board-native-component',
  imports: [BoardPiece, BoardTile, ButtonModule, RippleModule],
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

  currentVariant = linkedSignal<
    {
      flat: boolean;
      standing: boolean;
      capstone: boolean;
    } | null,
    TakPieceVariant
  >({
    source: () => this.canPlace(),
    computation: (source, prev) => {
      if (source && prev) {
        if (prev.value === 'flat' && !source.flat) {
          if (source.standing) return 'standing';
          if (source.capstone) return 'capstone';
        }
        if (prev.value === 'standing' && !source.standing) {
          if (source.flat) return 'flat';
          if (source.capstone) return 'capstone';
        }
        if (prev.value === 'capstone' && !source.capstone) {
          if (source.flat) return 'flat';
          if (source.standing) return 'standing';
        }
      }
      return prev?.value ?? 'flat';
    },
  });

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

  pieceData = computed(() => {
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

  areTilesInteractive = computed(() => {
    const mode = this.mode();
    const game = this.game();
    return (
      ((mode.type === 'online' && game.actualGame.currentPlayer === mode.localPlayer) ||
        mode.type === 'local') &&
      game.actualGame.gameState.type === 'ongoing'
    );
  });

  onClickTile(pos: TakPos) {
    this.action.emit({ type: 'partial', pos, variant: this.currentVariant() });
  }

  canPlace = computed(() => {
    const game = this.game();
    const mode = this.mode();
    let player: TakPlayer;
    if (mode.type === 'local') {
      player = game.actualGame.currentPlayer;
    } else if (mode.type === 'online') {
      player = mode.localPlayer;
    } else {
      return null;
    }
    const isOngoing = game.actualGame.gameState.type === 'ongoing';
    const reserves = game.actualGame.reserves[player];
    return {
      flat: isOngoing && reserves.pieces > 0,
      standing: isOngoing && reserves.pieces > 0 && game.actualGame.history.length >= 2,
      capstone: isOngoing && reserves.capstones > 0 && game.actualGame.history.length >= 2,
    };
  });

  setVariant(variant: TakPieceVariant) {
    this.currentVariant.set(variant);
  }
}
