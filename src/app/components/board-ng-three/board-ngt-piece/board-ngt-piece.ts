import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TakGameUI, TakUIPiece } from '../../../../tak-core/ui';
import { playerOpposite, TakGameSettings, TakPieceId, TakPieceVariant } from '../../../../tak-core';
import { beforeRender, NgtThreeEvent } from 'angular-three';
import { GameMode } from '../../game-component/game-component';
import { BufferGeometry, Euler, MathUtils, Mesh, Quaternion, Vector3 } from 'three';
import { gltfResource, textureResource } from 'angular-three-soba/loaders';
import { Board3dPresetService } from '../../../services/board-3d-preset-service/board-3d-preset-service';

@Component({
  selector: 'app-board-ngt-piece',
  imports: [],
  templateUrl: './board-ngt-piece.html',
  styleUrl: './board-ngt-piece.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BoardNgtPiece {
  id = input.required<TakPieceId>();
  data = input.required<TakUIPiece | undefined>();
  settings = input.required<TakGameSettings>();
  game = input.required<TakGameUI>();
  mode = input.required<GameMode>();
  currentVariant = input.required<TakPieceVariant | null>();
  clickPiece = output<boolean>();

  piecePresetName = signal<string>('basic');
  capstonePresetName = signal<string>('basic');

  private presetService = inject(Board3dPresetService);
  piecePreset = this.presetService.getComputedPiecePreset(() => this.piecePresetName());
  capstonePreset = this.presetService.getComputedCapstonePreset(() => this.capstonePresetName());

  meshes = gltfResource(
    () => {
      const piecePresetName = this.piecePresetName();
      const capstonePresetName = this.capstonePresetName();
      const pieceModelFile = this.piecePreset()?.lastValue()?.model.fileName;
      const capstoneModelFile = this.capstonePreset()?.lastValue()?.model.fileName;
      return {
        piece: this.presetService.getPresetPath('piece', piecePresetName, pieceModelFile, 'model'),
        capstone: this.presetService.getPresetPath(
          'capstone',
          capstonePresetName,
          capstoneModelFile,
          'model',
        ),
      };
    },
    {
      onLoad: (gltf) => {
        gltf.piece.scene.traverse((child) => {
          if (child instanceof Mesh) {
            this.pieceGeometry.set(child.geometry as BufferGeometry);
          }
        });
        gltf.capstone.scene.traverse((child) => {
          if (child instanceof Mesh) {
            this.capstoneGeometry.set(child.geometry as BufferGeometry);
          }
        });
      },
    },
  );

  pieceGeometry = signal<BufferGeometry | undefined>(undefined);
  capstoneGeometry = signal<BufferGeometry | undefined>(undefined);
  geometry = computed(() => {
    const data = this.layoutData();
    if (data.variant === 'capstone') {
      return this.capstoneGeometry();
    } else {
      return this.pieceGeometry();
    }
  });

  textures = textureResource(() => {
    const piecePresetName = this.piecePresetName();
    const capstonePresetName = this.capstonePresetName();
    const piecePreset = this.piecePreset()?.lastValue();
    const capstonePreset = this.capstonePreset()?.lastValue();
    const whitePieceFile = piecePreset?.texture.white.fileName;
    const blackPieceFile = piecePreset?.texture.black.fileName;
    const whiteCapstoneFile = capstonePreset?.texture.white.fileName;
    const blackCapstoneFile = capstonePreset?.texture.black.fileName;
    return {
      whitePiece: this.presetService.getPresetPath(
        'piece',
        piecePresetName,
        whitePieceFile,
        'texture',
      ),
      blackPiece: this.presetService.getPresetPath(
        'piece',
        piecePresetName,
        blackPieceFile,
        'texture',
      ),
      whiteCapstone: this.presetService.getPresetPath(
        'capstone',
        capstonePresetName,
        whiteCapstoneFile,
        'texture',
      ),
      blackCapstone: this.presetService.getPresetPath(
        'capstone',
        capstonePresetName,
        blackCapstoneFile,
        'texture',
      ),
    };
  });

  texture = computed(() => {
    const data = this.layoutData();
    const textures = this.textures.value();
    if (data.player === 'white') {
      return data.variant === 'capstone' ? textures?.whiteCapstone : textures?.whitePiece;
    } else {
      return data.variant === 'capstone' ? textures?.blackCapstone : textures?.blackPiece;
    }
  });

  layoutData = computed(() => {
    const pieceData = this.data();
    const id = this.id();
    const game = this.game();
    const mode = this.mode();
    const currentVariant = this.currentVariant();
    if (pieceData && !pieceData.deleted) return pieceData;
    const [idPlayer, idVariant, idNum] = id.split('/');
    const player = idPlayer === 'W' ? 'white' : 'black';
    const variant = idVariant === 'C' ? 'capstone' : 'flat';
    const num = parseInt(idNum);
    const prevPieceId: TakPieceId | null =
      num >= 1
        ? `${idPlayer as 'W' | 'B'}/${idVariant as 'P' | 'C'}/${(num - 1).toString()}`
        : null;
    const prevPiece = prevPieceId !== null ? game.pieces[prevPieceId] : null;
    const isFirstPieceInReserve = num === 0 || prevPiece?.deleted === false;

    const isFirstFlat = variant === 'flat' && num === 0;

    const effectivePlayer = game.actualGame.history.length < 2 ? playerOpposite(player) : player;
    const isFloating =
      isFirstPieceInReserve &&
      ((variant === 'capstone' && currentVariant === 'capstone') ||
        (variant === 'flat' && (currentVariant === 'flat' || currentVariant === 'standing'))) &&
      game.actualGame.gameState.type === 'ongoing' &&
      ((mode.type === 'online' && mode.localPlayer === effectivePlayer) ||
        (mode.type === 'local' && game.actualGame.currentPlayer === effectivePlayer));
    const actualVariant = isFloating && currentVariant === 'standing' ? 'standing' : variant;

    const boardSize = game.actualGame.settings.boardSize;
    const reserve = game.actualGame.settings.reserve;
    const revNum = (variant === 'capstone' ? reserve.capstones - num : reserve.pieces - num) - 1;
    const pieceStackSlots =
      variant === 'capstone' ? reserve.capstones : Math.max(2, boardSize - reserve.capstones);
    const piecesPerStack = Math.ceil(
      (variant === 'capstone' ? reserve.capstones : reserve.pieces) / pieceStackSlots,
    );
    const stack = pieceStackSlots - 1 - Math.floor(revNum / piecesPerStack);
    const height = revNum % piecesPerStack;
    const defaultPiece: TakUIPiece = {
      buriedPieceCount: 0,
      canBePicked: false,
      deleted: true,
      height,
      isFloating,
      player,
      pos: {
        x: (player === 'white') !== isFirstFlat ? -1.5 : boardSize + 0.5,
        y: stack + (variant === 'capstone' ? Math.max(boardSize - reserve.capstones, 2) : 0),
      },
      variant: actualVariant,
      zPriority: null,
    };
    return defaultPiece;
  });

  pieceScale = signal(0.7);
  pieceHeight = computed(() => {
    const preset = this.piecePreset()?.lastValue();
    const scale = this.pieceScale();
    return (preset?.model.height ?? 0) * scale;
  });
  positionOffset = computed(() => {
    const piecePreset = this.piecePreset()?.lastValue();
    const capstonePreset = this.capstonePreset()?.lastValue();
    const scale = this.pieceScale();
    return {
      flat: piecePreset?.model.flatOffset
        ? new Vector3(...piecePreset.model.flatOffset).multiplyScalar(scale)
        : new Vector3(0, 0, 0),
      standing: piecePreset?.model.standingOffset
        ? new Vector3(...piecePreset.model.standingOffset).multiplyScalar(scale)
        : new Vector3(0, 0, 0),
      capstone: capstonePreset?.model.offset
        ? new Vector3(...capstonePreset.model.offset).multiplyScalar(scale)
        : new Vector3(0, 0, 0),
    };
  });

  currentPos = signal(new Vector3());
  currentQuat = signal(new Quaternion());

  constructor() {
    beforeRender((state) => {
      const lerpFactor = 0.2 * state.delta * 60;
      const targetPos = this.targetPos();
      const targetRot = this.targetRotation();
      const targetDist = targetPos
        .clone()
        .setComponent(1, 0)
        .sub(this.currentPos().clone().setComponent(1, 0))
        .length();
      const newTargetPos = targetPos
        .clone()
        .addScaledVector(new Vector3(0, 1, 0), targetDist * 0.5);
      const actualDist = newTargetPos.clone().sub(this.currentPos().clone()).length();
      const moveLerpFactor =
        lerpFactor * MathUtils.lerp(2, 0.5, MathUtils.clamp(actualDist / 3, 0, 1));
      this.currentPos.set(new Vector3().copy(this.currentPos()).lerp(newTargetPos, moveLerpFactor));
      this.currentQuat.set(
        new Quaternion().copy(this.currentQuat()).slerp(targetRot, moveLerpFactor),
      );
    });
  }

  targetPos = computed(() => {
    const data = this.layoutData();
    const settings = this.settings();
    const pieceHeight = this.pieceHeight();
    const offset = this.positionOffset();
    let height = (data.height + (data.isFloating ? 2 : 0)) * pieceHeight;
    if (data.deleted) height -= 0.1;
    return new Vector3(
      data.pos.x + 0.5 - settings.boardSize / 2,
      height,
      -(data.pos.y + 0.5 - settings.boardSize / 2),
    ).add(offset[data.variant]);
  });
  targetRotation = computed(() => {
    const data = this.layoutData();
    if (data.variant === 'flat') {
      return new Quaternion().setFromEuler(new Euler(0, 0, 0));
    } else if (data.variant === 'standing') {
      return new Quaternion().setFromEuler(
        new Euler(0, (Math.PI / 4) * (data.player === 'white' ? 1 : -1), Math.PI / 2),
      );
    } else {
      return new Quaternion().setFromEuler(new Euler(0, 0, 0));
    }
  });

  onClick(event: NgtThreeEvent<MouseEvent>) {
    const game = this.game();
    const mode = this.mode();
    const data = this.layoutData();
    const isFirstFlat = data.variant === 'flat' && this.id().endsWith('/0');
    const effectivePlayer = isFirstFlat ? playerOpposite(data.player) : data.player;
    if (!data.deleted) return;
    if (mode.type === 'spectator') return;
    if (mode.type === 'online' && effectivePlayer !== mode.localPlayer) return;
    if (mode.type === 'local' && game.actualGame.currentPlayer !== effectivePlayer) return;
    event.stopPropagation();
    this.clickPiece.emit(data.variant === 'capstone');
  }
}
