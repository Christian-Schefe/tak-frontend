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
  stacks: (TakStack | null)[];

  constructor(size: number) {
    this.size = size;
    this.stacks = new Array(size * size).fill(null).map(() => null);
  }

  clone(): TakBoard {
    const newBoard = new TakBoard(this.size);
    newBoard.stacks = this.stacks.map((stack) => {
      if (stack === null) {
        return null;
      }
      return {
        variant: stack.variant,
        composition: stack.composition.map((piece) => ({ ...piece })),
      };
    });
    return newBoard;
  }

  getStack(pos: TakPos): TakStack | null {
    if (!isValidPos(this.size, pos)) {
      return null;
    }
    const index = pos.y * this.size + pos.x;
    return this.stacks[index];
  }

  canDoPlace(pos: TakPos): boolean {
    if (!isValidPos(this.size, pos)) {
      return false;
    }
    const index = pos.y * this.size + pos.x;
    return this.stacks[index] === null;
  }

  doPlace(pos: TakPos, variant: TakVariant, player: TakPlayer): { pieceId: TakPieceId } | null {
    if (!this.canDoPlace(pos)) {
      return null;
    }
    const index = pos.y * this.size + pos.x;
    const pieceId = v4();
    this.stacks[index] = {
      variant,
      composition: [{ player, id: pieceId }],
    };
    return { pieceId };
  }

  undoPlace(pos: TakPos) {
    if (!isValidPos(this.size, pos)) {
      return;
    }
    const index = pos.y * this.size + pos.x;
    this.stacks[index] = null;
  }

  canDoMove(pos: TakPos, dir: TakDir, drops: number[]): boolean {
    if (!isValidPos(this.size, pos)) {
      return false;
    }
    const index = pos.y * this.size + pos.x;
    const stack = this.stacks[index];
    if (stack === null) {
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
      if (drops[i] <= 0) {
        return false;
      }
      const curPos = offsetPos(pos, dir, i + 1);
      const curIndex = curPos.y * this.size + curPos.x;
      const curStack = this.stacks[curIndex];

      const canSmash = stack.variant === 'capstone' && i === drops.length - 1 && drops[i] === 1;
      if (
        curStack !== null &&
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
      this.stacks[index] = null;
    }
    movingPieces.reverse();
    let wasSmash = false;

    for (let i = 0; i < drops.length; i++) {
      const curPos = offsetPos(pos, dir, i + 1);
      const curIndex = curPos.y * this.size + curPos.x;
      let curStack = this.stacks[curIndex];
      if (curStack === null) {
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
        this.stacks[curIndex] = null;
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
    return this.stacks.every((stack) => stack !== null);
  }

  countFlats(): Record<TakPlayer, number> {
    const counts = {
      white: 0,
      black: 0,
    };
    for (const stack of this.stacks) {
      if (stack !== null) {
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
    return (
      stack !== null &&
      stack.variant !== 'standing' &&
      stack.composition[stack.composition.length - 1].player === player
    );
  }

  checkForRoad(player: TakPlayer): boolean {
    return this.findRoad(true, player) || this.findRoad(false, player);
  }

  private findRoad(horizontal: boolean, player: TakPlayer): boolean {
    const visited = Array(this.size * this.size)
      .fill(null)
      .map(() => false);
    const queue: TakPos[] = [];
    for (let i = 0; i < this.size; i++) {
      const pos = horizontal ? { x: 0, y: i } : { x: i, y: 0 };
      if (this.isRoadSquare(pos, player)) {
        queue.push(pos);
        visited[pos.y * this.size + pos.x] = true;
      }
    }
    while (queue.length > 0) {
      const pos = queue.shift();
      if (!pos) {
        break;
      }
      const isEnd = (horizontal ? pos.x : pos.y) === this.size - 1;
      if (isEnd) {
        return true;
      }
      for (const dir of allDirections) {
        const neighbor = offsetPos(pos, dir, 1);
        if (this.isRoadSquare(neighbor, player)) {
          const index = neighbor.y * this.size + neighbor.x;
          if (!visited[index]) {
            visited[index] = true;
            queue.push(neighbor);
          }
        }
      }
    }
    return false;
  }

  computeHashString(): string {
    return this.stacks
      .map((stack) => {
        if (stack !== null) {
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
