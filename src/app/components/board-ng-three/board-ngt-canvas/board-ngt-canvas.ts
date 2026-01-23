import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { extend, NgtArgs, NgtThreeEvent } from 'angular-three';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { Mesh, BoxGeometry, MeshBasicMaterial, CylinderGeometry, MOUSE } from 'three';
import { GameMode, TakActionEvent } from '../../game-component/game-component';
import { TakGameUI, TakUITile } from '../../../../tak-core/ui';
import { TakPieceId, TakPieceVariant, TakPlayer, TakPos } from '../../../../tak-core';
import { BoardNgtPiece } from '../board-ngt-piece/board-ngt-piece';

@Component({
  selector: 'app-board-ngt-canvas',
  imports: [NgtsOrbitControls, NgtsPerspectiveCamera, NgtArgs, BoardNgtPiece],
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
    extend({ Mesh, BoxGeometry, CylinderGeometry, MeshBasicMaterial });
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
    if (this.dragged) {
      console.log('Drag detected, not emitting action.');
      return;
    }
    this.action.emit({ type: 'partial', pos, variant: this.currentVariant() });
    if (this.mode().type === 'local' && this.canPlace()?.flat === true) {
      this.currentVariant.set('flat');
    }
  }

  private startX = 0;
  private startY = 0;
  private dragged = false;

  onPointerDown(event: NgtThreeEvent<PointerEvent>) {
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.dragged = false;
  }

  onPointerMove(event: NgtThreeEvent<PointerEvent>) {
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;

    if (dx * dx + dy * dy > 9) {
      this.dragged = true;
    }
  }

  setCurrentVariant(isCapstone: boolean) {
    console.log('Setting current variant, isCapstone:', isCapstone);
    const canPlace = this.canPlace();
    if (!canPlace) return;

    this.currentVariant.update((variant) => {
      if (variant === 'capstone' && canPlace.flat) {
        return 'flat';
      } else if (variant === 'flat') {
        if (isCapstone && canPlace.capstone) {
          return 'capstone';
        } else if (!isCapstone && canPlace.standing) {
          return 'standing';
        }
      } else {
        if (isCapstone && canPlace.capstone) {
          return 'capstone';
        } else if (!isCapstone && canPlace.flat) {
          return 'flat';
        }
      }
      return variant;
    });
  }

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
