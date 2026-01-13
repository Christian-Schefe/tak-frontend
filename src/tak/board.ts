import { InvalidMoveReason, InvalidPlaceReason, TakDir, TakPlayer, TakPos, TakVariant } from '.';

export interface TakBoard {
  size: number;
  stacks: (TakStack | null)[];
}

export interface TakStack {
  variant: TakVariant;
  composition: TakPlayer[];
}

export function takBoardNew(size: number): TakBoard {
  return {
    size,
    stacks: new Array(size * size).fill(null),
  };
}

function isPosInBounds(size: number, pos: TakPos): boolean {
  return pos.x >= 0 && pos.x < size && pos.y >= 0 && pos.y < size;
}

function offsetPos(pos: TakPos, dir: TakDir, amount: number): TakPos {
  switch (dir) {
    case 'up':
      return { x: pos.x, y: pos.y + amount };
    case 'down':
      return { x: pos.x, y: pos.y - amount };
    case 'left':
      return { x: pos.x - amount, y: pos.y };
    case 'right':
      return { x: pos.x + amount, y: pos.y };
  }
}

export function takBoardCanDoPlace(self: TakBoard, pos: TakPos): InvalidPlaceReason | null {
  if (!isPosInBounds(self.size, pos)) {
    return 'out-of-bounds';
  }
  const index = pos.y * self.size + pos.x;
  if (self.stacks[index] !== null) {
    return 'position-occupied';
  }
  return null;
}

export function takBoardPlace(
  self: TakBoard,
  pos: TakPos,
  variant: TakVariant,
  player: TakPlayer,
): InvalidPlaceReason | null {
  const invalidReason = takBoardCanDoPlace(self, pos);
  if (invalidReason !== null) {
    return invalidReason;
  }
  const index = pos.y * self.size + pos.x;
  self.stacks[index] = {
    variant,
    composition: [player],
  };
  return null;
}

export function takBoardCanDoMove(
  self: TakBoard,
  pos: TakPos,
  dir: TakDir,
  drops: number[],
): InvalidMoveReason | null {
  if (!isPosInBounds(self.size, pos)) {
    return 'out-of-bounds';
  }
  const index = pos.y * self.size + pos.x;
  const stack = self.stacks[index];
  if (stack === null) {
    return 'no-stack-at-position';
  }
  const totalPieces = stack.composition.length;
  const dropsSum = drops.reduce((a, b) => a + b, 0);
  if (dropsSum <= 0 || dropsSum > self.size) {
    return 'invalid-drops-configuration';
  }
  if (dropsSum > totalPieces) {
    return 'not-enough-pieces-to-move';
  }
  const endPos = offsetPos(pos, dir, drops.length);
  if (!isPosInBounds(self.size, endPos)) {
    return 'out-of-bounds';
  }
  for (let i = 0; i < drops.length; i++) {
    if (drops[i] <= 0) {
      return 'invalid-drops-configuration';
    }
    const curPos = offsetPos(pos, dir, i + 1);
    const curIndex = curPos.y * self.size + curPos.x;
    const curStack = self.stacks[curIndex];
    if (curStack !== null) {
      if (
        curStack.variant === 'standing' &&
        (stack.variant !== 'capstone' || i < drops.length - 1 || drops[i] != 1)
      ) {
        return 'cannot-move-over-standing-piece';
      }
      if (curStack.variant === 'capstone') {
        return 'cannot-move-over-capstone';
      }
    }
  }
  return null;
}

export function takBoardMove(
  self: TakBoard,
  pos: TakPos,
  dir: TakDir,
  drops: number[],
): InvalidMoveReason | null {
  const invalidReason = takBoardCanDoMove(self, pos, dir, drops);
  if (invalidReason !== null) {
    return invalidReason;
  }
  const index = pos.y * self.size + pos.x;
  const stack = self.stacks[index]!;
  const totalPieces = stack.composition.length;
  const dropsSum = drops.reduce((a, b) => a + b, 0);
  const variant = stack.variant;
  stack.variant = 'flat';
  const movingPieces = stack.composition.splice(totalPieces - dropsSum);
  if (dropsSum === totalPieces) {
    self.stacks[index] = null;
  }
  movingPieces.reverse();

  for (let i = 0; i < drops.length; i++) {
    const curPos = offsetPos(pos, dir, i + 1);
    const curIndex = curPos.y * self.size + curPos.x;
    if (self.stacks[curIndex] === null) {
      self.stacks[curIndex] = {
        variant: 'flat',
        composition: [],
      };
    }
    const curStack = self.stacks[curIndex]!;
    const toDrop = movingPieces.splice(movingPieces.length - drops[i]);
    curStack.composition.push(...toDrop);
    if (i == drops.length - 1) {
      curStack.variant = variant;
    }
  }
  return null;
}

export function takBoardIsFull(self: TakBoard): boolean {
  return self.stacks.every((stack) => stack !== null);
}

export function takBoardCountFlats(self: TakBoard): Record<TakPlayer, number> {
  const counts: Record<TakPlayer, number> = {
    white: 0,
    black: 0,
  };
  for (const stack of self.stacks) {
    if (stack !== null) {
      if (stack.variant === 'flat') {
        const player = stack.composition[stack.composition.length - 1];
        counts[player]++;
      }
    }
  }
  return counts;
}

function isRoadSquare(self: TakBoard, pos: TakPos, player: TakPlayer): boolean {
  if (!isPosInBounds(self.size, pos)) {
    return false;
  }
  const index = pos.y * self.size + pos.x;
  const stack = self.stacks[index];
  if (stack === null) {
    return false;
  }
  const topPiece = stack.composition[stack.composition.length - 1];
  return topPiece === player && stack.variant !== 'standing';
}

export function takBoardCheckForRoad(self: TakBoard, player: TakPlayer): boolean {
  return findRoad(self, true, player) || findRoad(self, false, player);
}

function findRoad(self: TakBoard, horizontal: boolean, player: TakPlayer): boolean {
  const visited = new Array(self.size * self.size).fill(false);
  const queue = [];

  for (let i = 0; i < self.size; i++) {
    const startPos = horizontal ? { x: 0, y: i } : { x: i, y: 0 };
    if (isRoadSquare(self, startPos, player)) {
      queue.push(startPos);
      visited[startPos.y * self.size + startPos.x] = true;
    }
  }

  while (queue.length > 0) {
    const pos = queue.shift()!;
    if ((horizontal && pos.x === self.size - 1) || (!horizontal && pos.y === self.size - 1)) {
      return true;
    }

    const directions: TakDir[] = ['up', 'down', 'left', 'right'];
    for (const dir of directions) {
      const neighborPos = offsetPos(pos, dir, 1);
      const index = neighborPos.y * self.size + neighborPos.x;
      if (isRoadSquare(self, neighborPos, player) && !visited[index]) {
        visited[index] = true;
        queue.push(neighborPos);
      }
    }
  }

  return false;
}

export function takBoardComputeHash(self: TakBoard): string {
  const hash = [];
  for (const stack of self.stacks) {
    if (stack === null) {
      hash.push('N');
    } else {
      let stackStr = stack.variant === 'flat' ? 'F' : stack.variant === 'standing' ? 'S' : 'C';
      for (const piece of stack.composition) {
        stackStr += piece === 'white' ? 'W' : 'B';
      }
      hash.push(stackStr);
    }
  }
  return hash.join(',');
}
