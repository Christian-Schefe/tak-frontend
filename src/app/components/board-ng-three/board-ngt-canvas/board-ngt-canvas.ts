import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { extend, NgtArgs } from 'angular-three';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsSoftShadows } from 'angular-three-soba/misc';
import { NgtpEffectComposer, NgtpSMAA } from 'angular-three-postprocessing';
import { NgtpN8AO } from 'angular-three-postprocessing/n8ao';
import {
  Mesh,
  BoxGeometry,
  MeshBasicMaterial,
  CylinderGeometry,
  MOUSE,
  SpotLight,
  PointLight,
  AmbientLight,
  PlaneGeometry,
} from 'three';
import { GameMode, TakActionEvent } from '../../game-component/game-component';
import { TakGameUI, TakUITile } from '../../../../tak-core/ui';
import { TakPieceId, TakPieceVariant, TakPlayer, TakPos } from '../../../../tak-core';
import { BoardNgtPiece } from '../board-ngt-piece/board-ngt-piece';

@Component({
  selector: 'app-board-ngt-canvas',
  imports: [
    NgtsOrbitControls,
    NgtsPerspectiveCamera,
    NgtArgs,
    BoardNgtPiece,
    NgtpEffectComposer,
    NgtpN8AO,
    NgtsSoftShadows,
    NgtpSMAA,
  ],
  templateUrl: './board-ngt-canvas.html',
  styleUrl: './board-ngt-canvas.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BoardNgtCanvas {
  mouseButtons = {
    LEFT: MOUSE.ROTATE,
    MIDDLE: undefined,
    RIGHT: MOUSE.ROTATE,
  };
  PI = Math.PI;
  game = input.required<TakGameUI>();
  action = output<TakActionEvent>();
  mode = input.required<GameMode>();

  tileRotation = [-Math.PI / 2, 0, 0];

  constructor() {
    extend({
      Mesh,
      BoxGeometry,
      CylinderGeometry,
      PlaneGeometry,
      MeshBasicMaterial,
      SpotLight,
      PointLight,
      AmbientLight,
    });
  }

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

  areTilesInteractive = computed(() => {
    const mode = this.mode();
    const game = this.game();
    return (
      ((mode.type === 'online' && game.actualGame.currentPlayer === mode.localPlayer) ||
        mode.type === 'local') &&
      game.actualGame.gameState.type === 'ongoing'
    );
  });

  pieces = computed(() => this.game().pieces);

  piecesWithReserve = computed(() => {
    const settings = this.gameSettings();
    const pieceIds: TakPieceId[] = [];
    for (let i = 0; i < settings.reserve.pieces; i++) {
      pieceIds.push(`W/P/${i.toString()}`);
      pieceIds.push(`B/P/${i.toString()}`);
    }
    for (let i = 0; i < settings.reserve.capstones; i++) {
      pieceIds.push(`W/C/${i.toString()}`);
      pieceIds.push(`B/C/${i.toString()}`);
    }

    pieceIds.sort((a, b) => a.localeCompare(b));
    return pieceIds;
  });

  pieceData = computed(() => {
    const pieces = this.pieces();
    const pieceIds = this.piecesWithReserve().map((id) => ({
      id,
      data: pieces[id],
    }));
    pieceIds.sort((a, b) => a.id.localeCompare(b.id));
    return pieceIds;
  });

  onTileClick(pos: TakPos) {
    if (!this.areTilesInteractive()) return;
    const variant = this.currentVariant();
    if (variant === null) return;
    this.action.emit({ type: 'partial', pos, variant });
    this.currentVariant.set(null);
  }

  setCurrentVariant(isCapstone: boolean) {
    if (!this.areTilesInteractive()) return;
    console.log('Setting current variant, isCapstone:', isCapstone);
    const canPlace = this.canPlace();
    if (!canPlace) return;

    this.currentVariant.update((variant) => {
      if (isCapstone && canPlace.capstone && variant !== 'capstone') {
        return 'capstone';
      } else if (isCapstone) {
        return null;
      }

      if (variant === 'flat' && canPlace.standing) {
        return 'standing';
      }
      if ((variant === null || variant === 'capstone') && canPlace.flat) {
        return 'flat';
      }
      return null;
    });
  }

  currentVariant = linkedSignal<
    {
      canPlace: {
        flat: boolean;
        standing: boolean;
        capstone: boolean;
      } | null;
      interactive: boolean;
    },
    TakPieceVariant | null
  >({
    source: () => ({ canPlace: this.canPlace(), interactive: this.areTilesInteractive() }),
    computation: (source, prev) => {
      if (!source.interactive) return null;
      const canPlace = source.canPlace;
      if (canPlace && prev) {
        if (prev.value === 'flat' && !canPlace.flat) {
          if (canPlace.standing) return 'standing';
          if (canPlace.capstone) return 'capstone';
        }
        if (prev.value === 'standing' && !canPlace.standing) {
          if (canPlace.flat) return 'flat';
          if (canPlace.capstone) return 'capstone';
        }
        if (prev.value === 'capstone' && !canPlace.capstone) {
          if (canPlace.flat) return 'flat';
          if (canPlace.standing) return 'standing';
        }
      }
      return prev?.value ?? null;
    },
  });

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
}
