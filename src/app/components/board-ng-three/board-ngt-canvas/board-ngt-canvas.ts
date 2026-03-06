import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
  linkedSignal,
  output,
  signal,
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
  Texture,
  BufferGeometry,
  RingGeometry,
} from 'three';
import { GameMode, TakActionEvent } from '../../game-component/game-component';
import { TakGameUI, TakUITile } from '../../../../tak-core/ui';
import { TakPieceId, TakPieceVariant, TakPlayer, TakPos } from '../../../../tak-core';
import { BoardNgtPiece } from '../board-ngt-piece/board-ngt-piece';
import { fontResource, gltfResource, textureResource } from 'angular-three-soba/loaders';
import { Board3dPresetService } from '../../../services/board-3d-preset-service/board-3d-preset-service';
import { TextGeometry } from 'three-stdlib';

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
  tableRotation = [0, Math.PI / 2, 0];

  private presetService = inject(Board3dPresetService);

  constructor() {
    extend({
      Mesh,
      BoxGeometry,
      CylinderGeometry,
      PlaneGeometry,
      RingGeometry,
      MeshBasicMaterial,
      TextGeometry,
      SpotLight,
      PointLight,
      AmbientLight,
    });
  }

  boardPresetName = signal<string>('basic');
  boardPreset = this.presetService.getComputedBoardPreset(() => this.boardPresetName());

  tablePresetName = signal<string>('basic');
  tablePreset = this.presetService.getComputedTablePreset(() => this.tablePresetName());

  textures = textureResource(() => {
    const boardPresetName = this.boardPresetName();
    const boardPreset = this.boardPreset()?.lastValue();
    const tablePresetName = this.tablePresetName();
    const tablePreset = this.tablePreset()?.lastValue();
    return {
      board_3x3: this.presetService.getPresetPath(
        'board',
        boardPresetName,
        boardPreset?.texture['3x3'].fileName,
        'texture',
      ),
      board_4x4: this.presetService.getPresetPath(
        'board',
        boardPresetName,
        boardPreset?.texture['4x4'].fileName,
        'texture',
      ),
      board_5x5: this.presetService.getPresetPath(
        'board',
        boardPresetName,
        boardPreset?.texture['5x5'].fileName,
        'texture',
      ),
      board_6x6: this.presetService.getPresetPath(
        'board',
        boardPresetName,
        boardPreset?.texture['6x6'].fileName,
        'texture',
      ),
      board_7x7: this.presetService.getPresetPath(
        'board',
        boardPresetName,
        boardPreset?.texture['7x7'].fileName,
        'texture',
      ),
      board_8x8: this.presetService.getPresetPath(
        'board',
        boardPresetName,
        boardPreset?.texture['8x8'].fileName,
        'texture',
      ),
      table: this.presetService.getPresetPath(
        'table',
        tablePresetName,
        tablePreset?.texture.fileName,
        'texture',
      ),
    };
  });

  boardTexture = computed(() => {
    const settings = this.gameSettings();
    const boardSizeStr = settings.boardSize.toString();
    const textureKey = `board_${boardSizeStr}x${boardSizeStr}` as const;
    const textures = this.textures.value() as Record<string, Texture | undefined> | undefined;
    return textures ? textures[textureKey] : undefined;
  });
  meshes = gltfResource(
    () => {
      const tablePresetName = this.tablePresetName();
      const tablePreset = this.tablePreset()?.lastValue();
      return {
        table: this.presetService.getPresetPath(
          'table',
          tablePresetName,
          tablePreset?.model.fileName,
          'model',
        ),
      };
    },
    {
      onLoad: (gltf) => {
        gltf.table.scene.traverse((child) => {
          if (child instanceof Mesh) {
            this.tableGeometry.set(child.geometry as BufferGeometry);
          }
        });
      },
    },
  );
  tableGeometry = signal<BufferGeometry | undefined>(undefined);

  gameSettings = computed(() => {
    return this.game().actualGame.settings;
  });

  private tiles = computed(() => this.game().tiles);

  font = fontResource(() => '/board-3d/helvetiker_regular.typeface.json');

  textPositions = computed(() => {
    const settings = this.gameSettings();
    const positions: { x: number; y: number; label: string }[] = [];
    for (let i = 0; i < settings.boardSize; i++) {
      const char = String.fromCharCode('A'.charCodeAt(0) + i);
      positions.push({ x: i - 0.05, y: -0.7, label: char });
      positions.push({ x: -0.7, y: i - 0.05, label: (i + 1).toString() });
    }
    return positions;
  });

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
    this.action.emit({ type: 'partial', pos, variant: variant ?? 'flat' });
    this.currentVariant.set(null);
  }

  lastMovePositions = computed(() => {
    const game = this.game();
    const positions = [];
    for (let y = 0; y < game.tiles.length; y++) {
      for (let x = 0; x < game.tiles[y].length; x++) {
        const tile = game.tiles[y][x];
        if (tile.lastMove) {
          positions.push({ x, y });
        }
      }
    }
    return new Set(positions);
  });

  hoveredTile = signal<TakPos | null>(null);

  showHoverHighlight = computed(() => {
    const hoveredTile = this.hoveredTile();
    if (!hoveredTile) return false;
    const tile = this.game().tiles[hoveredTile.y][hoveredTile.x];
    return tile.hoverable;
  });

  onTileHover(pos: TakPos, hover: boolean) {
    if (!this.areTilesInteractive()) {
      this.hoveredTile.set(null);
      return;
    }
    this.hoveredTile.update((prev) => {
      if (prev && prev.x === pos.x && prev.y === pos.y) {
        return hover ? pos : null;
      } else if (hover) {
        return pos;
      } else {
        return prev;
      }
    });
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
