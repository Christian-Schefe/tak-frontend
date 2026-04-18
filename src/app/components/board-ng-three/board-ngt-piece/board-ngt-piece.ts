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
import { playerOpponent, TakBaseGameSettings, TakPieceId, TakVariant } from '../../../../tak-core';
import { beforeRender, NgtArgs, NgtThreeEvent } from 'angular-three';
import { GameMode } from '../../game-component/game-component';
import { Euler, MathUtils, Quaternion, Vector3 } from 'three';
import { gltfResource } from 'angular-three-soba/loaders';
import { Board3dPresetService } from '../../../services/board-3d-preset-service/board-3d-preset-service';
import { SettingsService } from '../../../services/settings-service/settings-service';
import { SkeletonUtils } from 'three-stdlib';

@Component({
  selector: 'app-board-ngt-piece',
  imports: [NgtArgs],
  templateUrl: './board-ngt-piece.html',
  styleUrl: './board-ngt-piece.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BoardNgtPiece {
  id = input.required<TakPieceId>();
  data = input.required<TakUIPiece | undefined>();
  settings = input.required<TakBaseGameSettings>();
  game = input.required<TakGameUI>();
  mode = input.required<GameMode>();
  currentVariant = input.required<TakVariant | null>();
  clickPiece = output<boolean>();
  settingsService = inject(SettingsService);

  piecePresetName = computed(() => {
    const settings = this.settingsService.board3dSettings();
    return settings.piecePreset;
  });

  private presetService = inject(Board3dPresetService);
  piecePreset = this.presetService.getComputedPiecePreset(() => this.piecePresetName());

  meshes = gltfResource(() => {
    const piecePresetName = this.piecePresetName();
    const pieceWhiteModelFile = this.piecePreset()?.lastValue()?.whitePieceModel.fileName;
    const pieceBlackModelFile = this.piecePreset()?.lastValue()?.blackPieceModel.fileName;
    const capstoneWhiteModelFile = this.piecePreset()?.lastValue()?.whiteCapstoneModel.fileName;
    const capstoneBlackModelFile = this.piecePreset()?.lastValue()?.blackCapstoneModel.fileName;

    return {
      pieceWhite: this.presetService.getPresetPath(
        'piece',
        piecePresetName,
        pieceWhiteModelFile,
        'model',
      ),
      pieceBlack: this.presetService.getPresetPath(
        'piece',
        piecePresetName,
        pieceBlackModelFile,
        'model',
      ),
      capstoneWhite: this.presetService.getPresetPath(
        'piece',
        piecePresetName,
        capstoneWhiteModelFile,
        'model',
      ),
      capstoneBlack: this.presetService.getPresetPath(
        'piece',
        piecePresetName,
        capstoneBlackModelFile,
        'model',
      ),
    };
  });

  gltf = computed(() => {
    const meshes = this.meshes.value();
    const data = this.layoutData();
    if (!meshes) return null;
    const mesh =
      data.player === 'white'
        ? data.variant === 'capstone'
          ? meshes.capstoneWhite
          : meshes.pieceWhite
        : data.variant === 'capstone'
          ? meshes.capstoneBlack
          : meshes.pieceBlack;
    const clonedScene = SkeletonUtils.clone(mesh.scene);
    clonedScene.traverse((obj) => {
      obj.castShadow = true;
      obj.receiveShadow = true;
    });
    return clonedScene;
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

    const effectivePlayer =
      game.actualGame.actionHistory.length < 2 ? playerOpponent(player) : player;
    const isFloating =
      isFirstPieceInReserve &&
      ((variant === 'capstone' && currentVariant === 'capstone') ||
        (variant === 'flat' && (currentVariant === 'flat' || currentVariant === 'standing'))) &&
      game.actualGame.isOngoing() &&
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

  presetModel = computed(() => {
    const piecePreset = this.piecePreset()?.lastValue();
    const data = this.layoutData();
    return data.player === 'white'
      ? data.variant === 'capstone'
        ? piecePreset?.whiteCapstoneModel
        : piecePreset?.whitePieceModel
      : data.variant === 'capstone'
        ? piecePreset?.blackCapstoneModel
        : piecePreset?.blackPieceModel;
  });

  visualScale = computed(() => {
    const scale = this.pieceScale();
    const model = this.presetModel();
    return scale * (model?.scale ?? 1);
  });

  private pieceScale = computed(() => {
    const settings = this.settingsService.board3dSettings();
    return Math.max(Math.min(settings.pieceScale, 1), 0.5);
  });
  private pieceHeight = computed(() => {
    const piecePreset = this.piecePreset()?.lastValue();
    const model = this.presetModel();
    const scale = this.pieceScale();
    return (piecePreset?.pieceHeight ?? 0) * scale * (model?.scale ?? 1);
  });
  private positionOffset = computed(() => {
    const data = this.layoutData();
    const scale = this.pieceScale();
    const model = this.presetModel();

    const isStacked = data.height > 0;

    const baseOffsetVal =
      data.variant === 'standing' && model?.standingOffset ? model.standingOffset : model?.offset;

    const baseOffset = baseOffsetVal
      ? new Vector3(...baseOffsetVal).multiplyScalar(scale * (model?.scale ?? 1))
      : new Vector3(0, 0, 0);

    if (isStacked) {
      const baseStackedOffsetVal =
        data.variant === 'standing' && model?.stackedStandingOffset
          ? model.stackedStandingOffset
          : model?.stackedOffset;
      return baseOffset.add(
        baseStackedOffsetVal
          ? new Vector3(...baseStackedOffsetVal).multiplyScalar(scale * (model?.scale ?? 1))
          : new Vector3(0, 0, 0),
      );
    } else {
      return baseOffset;
    }
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
    ).add(offset);
  });

  targetRotation = computed(() => {
    const data = this.layoutData();
    const model = this.presetModel();
    if (data.variant === 'standing') {
      const standingRotation = model?.standingRotation ?? [
        0,
        45 * (data.player === 'white' ? 1 : -1),
        90,
      ];
      const radiansRotation = standingRotation.map((angle) => MathUtils.degToRad(angle));
      return new Quaternion().setFromEuler(new Euler(...radiansRotation));
    } else {
      return new Quaternion().setFromEuler(new Euler(0, 0, 0));
    }
  });

  onClick(event: NgtThreeEvent<MouseEvent>) {
    const game = this.game();
    const mode = this.mode();
    const data = this.layoutData();
    const isFirstFlat = data.variant === 'flat' && this.id().endsWith('/0');
    const effectivePlayer = isFirstFlat ? playerOpponent(data.player) : data.player;
    if (!data.deleted) return;
    if (mode.type === 'spectator') return;
    if (mode.type === 'online' && effectivePlayer !== mode.localPlayer) return;
    if (mode.type === 'local' && game.actualGame.currentPlayer !== effectivePlayer) return;
    event.stopPropagation();
    this.clickPiece.emit(data.variant === 'capstone');
  }
}
