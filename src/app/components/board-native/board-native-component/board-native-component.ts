import { Component, computed, effect, inject, input, linkedSignal, output } from '@angular/core';
import { TakAction, TakBaseGame, TakPlayer, TakPos, TakVariant } from '../../../../tak-core';
import { GameMode } from '../../game-component/game-component';
import { TakGameUI, TakUITile } from '../../../../tak-core/ui';
import { BoardPiece } from '../board-piece/board-piece';
import { BoardTile } from '../board-tile/board-tile';
import { SettingsService } from '../../../services/settings-service/settings-service';
import { ThemeParams, themes } from '../../../../2d-themes';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { filterTruthy } from '../../../util';
import { produce } from 'immer';

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
  game = input.required<TakBaseGame>();
  plyIndex = input.required<number | null>();
  action = output<TakAction>();
  mode = input.required<GameMode>();
  private settingsService = inject(SettingsService);

  gameUi = linkedSignal<TakBaseGame, TakGameUI>({
    source: () => this.game(),
    computation: (source, prev) => {
      if (prev?.value) {
        return produce(prev.value, (gameUi) => {
          gameUi.updateGame(source);
          return gameUi;
        });
      }
      return new TakGameUI(source);
    },
  });

  private _updateGameUiEffect = effect(() => {
    const game = this.game();
    this.gameUi.update((prev) => {
      return produce(prev, (gameUi) => {
        gameUi.updateGame(game);
        return gameUi;
      });
    });
  });
  private _updatePlyIndexGameUiEffect = effect(() => {
    const plyIndex = this.plyIndex();
    this.gameUi.update((prev) => {
      return produce(prev, (gameUi) => {
        gameUi.setPlyIndex(plyIndex);
        return gameUi;
      });
    });
  });

  boardSettings = computed<BoardSettings>(() => {
    const settings = this.settingsService.boardNativeSettings();
    const theme = themes[settings.theme];
    return { theme, axisLabels: true, axisLabelSize: 14 };
  });

  currentVariant = linkedSignal<
    {
      flat: boolean;
      standing: boolean;
      capstone: boolean;
    } | null,
    TakVariant
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
    return this.game().settings;
  });

  private tiles = computed(() => this.gameUi().tiles);

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

  pieces = computed(() => this.gameUi().pieces);

  pieceData = computed(() => {
    const pieces = this.pieces();
    const pieceIds = Object.entries(pieces)
      .map(([id, data]) =>
        data
          ? {
              id,
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
      ((mode.type === 'online' && game.currentPlayer === mode.localPlayer) ||
        mode.type === 'local') &&
      game.isOngoing()
    );
  });

  onClickTile(pos: TakPos) {
    this.gameUi.update((prev) => {
      const action = prev.tryPlaceOrAddToPartialAction(pos, this.currentVariant());
      return produce(prev, (gameUi) => {
        if (action) {
          this.action.emit(action);
        } else {
          gameUi.updatePartialAction(pos);
        }
        return gameUi;
      });
    });
  }

  canPlace = computed(() => {
    const game = this.game();
    const mode = this.mode();
    let player: TakPlayer;
    if (mode.type === 'local') {
      player = game.currentPlayer;
    } else if (mode.type === 'online') {
      player = mode.localPlayer;
    } else {
      return null;
    }
    const isOngoing = game.isOngoing();
    const reserves = game.reserves[player];
    return {
      flat: isOngoing && reserves.pieces > 0,
      standing: isOngoing && reserves.pieces > 0 && game.actionHistory.length >= 2,
      capstone: isOngoing && reserves.capstones > 0 && game.actionHistory.length >= 2,
    };
  });

  setVariant(variant: TakVariant) {
    this.currentVariant.set(variant);
  }
}
