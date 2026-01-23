import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, output, signal } from '@angular/core';
import { TakGameUI, TakUIPiece } from '../../../../tak-core/ui';
import { playerOpposite, TakGameSettings, TakPieceId, TakPieceVariant } from '../../../../tak-core';
import { beforeRender, NgtArgs, NgtThreeEvent } from 'angular-three';
import { GameMode } from '../../game-component/game-component';
import { Euler, Quaternion, Vector3 } from 'three';

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
  settings = input.required<TakGameSettings>();
  game = input.required<TakGameUI>();
  mode = input.required<GameMode>();
  currentVariant = input.required<TakPieceVariant>();
  clickPiece = output<boolean>();

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

    const effectivePlayer = game.actualGame.history.length < 2 ? playerOpposite(player) : player;
    const isFloating =
      isFirstPieceInReserve &&
      (variant === 'capstone') === (currentVariant === 'capstone') &&
      game.actualGame.gameState.type === 'ongoing' &&
      ((mode.type === 'online' && mode.localPlayer === effectivePlayer) ||
        (mode.type === 'local' && game.actualGame.currentPlayer === effectivePlayer));
    const actualVariant = isFloating && currentVariant === 'standing' ? 'standing' : variant;

    const boardSize = game.actualGame.settings.boardSize;
    const reserve = game.actualGame.settings.reserve;
    const revNum = (variant === 'capstone' ? reserve.capstones - num : reserve.pieces - num) - 1;
    const pieceStackSlots =
      variant === 'capstone' ? reserve.capstones : Math.max(1, boardSize - reserve.capstones);
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
        x: player === 'white' ? -1.5 : boardSize + 0.5,
        y: stack + (variant === 'capstone' ? 0 : reserve.capstones),
      },
      variant: actualVariant,
      zPriority: null,
    };
    return defaultPiece;
  });

  pieceSize = 0.7;
  pieceHeight = this.pieceSize * 0.2;

  currentPos = signal(new Vector3());
  currentQuat = signal(new Quaternion());

  constructor() {
    beforeRender(() => {
      const lerpFactor = 0.2;
      const targetPos = this.targetPos();
      const targetRot = this.targetRotation();

      this.currentPos.set(new Vector3().copy(this.currentPos()).lerp(targetPos, lerpFactor));
      this.currentQuat.set(new Quaternion().copy(this.currentQuat()).slerp(targetRot, lerpFactor));
    });
  }

  targetPos = computed(() => {
    const data = this.layoutData();
    const settings = this.settings();
    let height = (data.height + (data.isFloating ? 2 : 0)) * this.pieceHeight;
    if (data.deleted) height -= 0.1;
    return new Vector3(
      data.pos.x + 0.5 - settings.boardSize / 2,
      height + (data.variant === 'flat' ? this.pieceHeight / 2 : this.pieceSize / 2),
      data.pos.y + 0.5 - settings.boardSize / 2,
    );
  });
  targetRotation = computed(() => {
    const data = this.layoutData();
    if (data.variant === 'flat') {
      return new Quaternion().setFromEuler(new Euler(0, 0, 0));
    } else if (data.variant === 'standing') {
      return new Quaternion().setFromEuler(new Euler(0, Math.PI / 4, Math.PI / 2));
    } else {
      return new Quaternion().setFromEuler(new Euler(0, 0, 0));
    }
  });

  onClick(event: NgtThreeEvent<MouseEvent>) {
    const game = this.game();
    const mode = this.mode();
    const data = this.layoutData();
    const effectivePlayer =
      game.actualGame.history.length < 2 ? playerOpposite(data.player) : data.player;
    if (!data.deleted) return;
    if (mode.type === 'spectator') return;
    if (mode.type === 'online' && effectivePlayer !== mode.localPlayer) return;
    if (mode.type === 'local' && game.actualGame.currentPlayer !== effectivePlayer) return;
    event.stopPropagation();
    this.clickPiece.emit(data.variant === 'capstone');
  }
}
