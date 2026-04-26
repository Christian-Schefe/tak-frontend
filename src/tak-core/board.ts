import { immerable } from 'immer';
import { v4 } from 'uuid';
import {
  allDirections,
  isValidPos,
  offsetPos,
  TakDir,
  TakPieceId,
  TakPlayer,
  TakPos,
  TakVariant,
} from '.';

export interface TakPiece {
  player: TakPlayer;
  id: TakPieceId;
}

export interface TakStack {
  variant: TakVariant;
  composition: TakPiece[];
}

export class TakBoard {
  [immerable] = true;

  size: number;
  stacks: (TakStack | undefined)[];
  private kindIndices: Record<TakPlayer, Record<'flat' | 'capstone', number>> = {
    white: { flat: 0, capstone: 0 },
    black: { flat: 0, capstone: 0 },
  };

  constructor(size: number) {
    this.size = size;
    this.stacks = new Array(size * size).fill(undefined).map(() => undefined);
  }

  clone(): TakBoard {
    const newBoard = new TakBoard(this.size);
    newBoard.stacks = this.stacks.map((stack) => {
      if (stack === undefined) {
        return undefined;
      }
      return {
        variant: stack.variant,
        composition: stack.composition.map((piece) => ({ ...piece })),
      };
    });
    return newBoard;
  }

  getStack(pos: TakPos): TakStack | undefined {
    if (!isValidPos(this.size, pos)) {
      return undefined;
    }
    const index = pos.y * this.size + pos.x;
    return this.stacks[index];
  }

  canDoPlace(pos: TakPos): boolean {
    if (!isValidPos(this.size, pos)) {
      return false;
    }
    const index = pos.y * this.size + pos.x;
    return this.stacks[index] === undefined;
  }

  doPlace(pos: TakPos, variant: TakVariant, player: TakPlayer): { pieceId: TakPieceId } | null {
    if (!this.canDoPlace(pos)) {
      return null;
    }
    const index = pos.y * this.size + pos.x;
    const pieceType = variant === 'capstone' ? 'capstone' : 'flat';
    const pieceId: TakPieceId = {
      uuid: v4(),
      type: pieceType,
      player,
      kindIndex: this.kindIndices[player][pieceType]++,
    };
    this.stacks[index] = {
      variant,
      composition: [{ player, id: pieceId }],
    };
    return { pieceId };
  }

  canUndoPlace(pos: TakPos): boolean {
    if (!isValidPos(this.size, pos)) {
      return false;
    }
    const index = pos.y * this.size + pos.x;
    return this.stacks[index] !== undefined && this.stacks[index].composition.length === 1;
  }

  undoPlace(pos: TakPos) {
    if (!this.canUndoPlace(pos)) {
      return;
    }
    const index = pos.y * this.size + pos.x;
    const stack = this.stacks[index];
    const piece = stack?.composition[0];
    if (!piece) {
      return;
    }
    this.stacks[index] = undefined;
    this.kindIndices[piece.id.player][piece.id.type]--;
  }

  canDoMove(pos: TakPos, dir: TakDir, drops: number[]): boolean {
    if (!isValidPos(this.size, pos)) {
      return false;
    }
    const index = pos.y * this.size + pos.x;
    const stack = this.stacks[index];
    if (stack === undefined) {
      return false;
    }
    const dropsSum = drops.reduce((a, b) => a + b, 0);
    if (dropsSum <= 0 || dropsSum > this.size || dropsSum > stack.composition.length) {
      return false;
    }
    const endPos = offsetPos(pos, dir, drops.length);
    if (!isValidPos(this.size, endPos)) {
      return false;
    }
    for (let i = 0; i < drops.length; i++) {
      const dropAmount = drops[i];
      if (dropAmount <= 0) {
        return false;
      }
      const curPos = offsetPos(pos, dir, i + 1);
      const curIndex = curPos.y * this.size + curPos.x;
      const curStack = this.stacks[curIndex];

      const canSmash = stack.variant === 'capstone' && i === drops.length - 1 && dropAmount === 1;
      if (
        curStack !== undefined &&
        (curStack.variant === 'capstone' || (curStack.variant === 'standing' && !canSmash))
      ) {
        return false;
      }
    }
    return true;
  }

  doMove(
    pos: TakPos,
    dir: TakDir,
    drops: number[],
  ): { pieceIds: TakPieceId[]; wasSmash: boolean } | null {
    if (!this.canDoMove(pos, dir, drops)) {
      return null;
    }
    const index = pos.y * this.size + pos.x;
    const stack = this.stacks[index];
    if (!stack) {
      return null;
    }
    const dropsSum = drops.reduce((a, b) => a + b, 0);
    const movingPieces = stack.composition.splice(-dropsSum);
    const movingPieceIds = movingPieces.map((piece) => piece.id);

    const variant = stack.variant;
    stack.variant = 'flat';
    if (stack.composition.length === 0) {
      this.stacks[index] = undefined;
    }
    movingPieces.reverse();
    let wasSmash = false;

    for (let i = 0; i < drops.length; i++) {
      const curPos = offsetPos(pos, dir, i + 1);
      const curIndex = curPos.y * this.size + curPos.x;
      let curStack = this.stacks[curIndex];
      if (curStack === undefined) {
        curStack = { variant: 'flat', composition: [] };
        this.stacks[curIndex] = curStack;
      }
      const toDrop = movingPieces.splice(-drops[i]);
      toDrop.reverse();
      curStack.composition.push(...toDrop);
      if (i === drops.length - 1) {
        if (curStack.variant === 'standing') {
          wasSmash = true;
        }
        curStack.variant = variant;
      }
    }
    return { pieceIds: movingPieceIds, wasSmash };
  }

  undoMove(pos: TakPos, dir: TakDir, drops: number[], wasSmash: boolean): void {
    const index = pos.y * this.size + pos.x;

    const recoveredPieces: TakPiece[] = [];
    let variantToRestore: TakVariant = 'flat';

    for (let i = drops.length - 1; i >= 0; i--) {
      const curPos = offsetPos(pos, dir, i + 1);
      const curIndex = curPos.y * this.size + curPos.x;
      const curStack = this.stacks[curIndex];

      if (!curStack) continue;

      const taken = curStack.composition.splice(-drops[i]);
      taken.reverse();
      recoveredPieces.push(...taken);
      if (i === drops.length - 1) {
        variantToRestore = curStack.variant;
        curStack.variant = wasSmash ? 'standing' : 'flat';
      }
      if (curStack.composition.length === 0) {
        this.stacks[curIndex] = undefined;
      }
    }

    recoveredPieces.reverse();

    let stack = this.stacks[index];
    if (!stack) {
      stack = { variant: 'flat', composition: [] };
      this.stacks[index] = stack;
    }

    stack.variant = variantToRestore;
    stack.composition.push(...recoveredPieces);
  }

  isFull(): boolean {
    return this.stacks.every((stack) => stack !== undefined);
  }

  countFlats(): Record<TakPlayer, number> {
    const counts = {
      white: 0,
      black: 0,
    };
    for (const stack of this.stacks) {
      if (stack !== undefined) {
        const topPiece = stack.composition[stack.composition.length - 1];
        if (stack.variant === 'flat') {
          counts[topPiece.player]++;
        }
      }
    }
    return counts;
  }

  private isRoadSquare(pos: TakPos, player: TakPlayer): boolean {
    if (!isValidPos(this.size, pos)) {
      return false;
    }
    const index = pos.y * this.size + pos.x;
    const stack = this.stacks[index];
    if (stack === undefined || stack.variant === 'standing') {
      return false;
    }
    const topPiece = stack.composition[stack.composition.length - 1];
    return topPiece.player === player;
  }

  checkForRoad(player: TakPlayer): TakPos[] | null {
    return this.findRoad(true, player) ?? this.findRoad(false, player);
  }

  private findRoad(horizontal: boolean, player: TakPlayer): TakPos[] | null {
    const visited = new Array(this.size * this.size).fill(false).map(() => false);
    const prev: (TakPos | null)[] = new Array(this.size * this.size).fill(null).map(() => null);
    const queue: TakPos[] = [];

    const toIndex = (p: TakPos) => p.y * this.size + p.x;

    for (let i = 0; i < this.size; i++) {
      const pos = horizontal ? { x: 0, y: i } : { x: i, y: 0 };
      if (this.isRoadSquare(pos, player)) {
        const idx = toIndex(pos);
        queue.push(pos);
        visited[idx] = true;
      }
    }

    while (queue.length > 0) {
      const pos = queue.shift();
      if (!pos) {
        break;
      }

      const isEnd = (horizontal ? pos.x : pos.y) === this.size - 1;
      if (isEnd) {
        const path: TakPos[] = [];
        let cur: TakPos | null = pos;

        while (cur) {
          path.push(cur);
          cur = prev[toIndex(cur)];
        }

        path.reverse();
        return path;
      }

      for (const dir of allDirections) {
        const neighbor = offsetPos(pos, dir, 1);

        if (!this.isRoadSquare(neighbor, player)) continue;

        const nIdx = toIndex(neighbor);
        if (visited[nIdx]) continue;

        visited[nIdx] = true;
        prev[nIdx] = pos;
        queue.push(neighbor);
      }
    }

    return null;
  }

  computeHashString(): string {
    return this.stacks
      .map((stack) => {
        if (stack !== undefined) {
          const variantChar =
            stack.variant === 'flat' ? 'F' : stack.variant === 'standing' ? 'S' : 'C';
          const compositionStr = stack.composition
            .map((piece) => (piece.player === 'white' ? 'W' : 'B'))
            .join('');
          return variantChar + compositionStr;
        } else {
          return 'N';
        }
      })
      .join(',');
  }
}
