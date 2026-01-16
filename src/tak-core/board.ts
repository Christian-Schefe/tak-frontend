import type {
  TakBoard,
  TakPos,
  TakDir,
  TakActionRecord,
  TakPieceVariant,
  TakPlayer,
  TakStack,
  TakTrackedPiece,
} from '.';
import { coordEquals, coordToString, newCoord, offsetCoord } from './coord';

export function isValidCoord(size: number, pos: TakPos): boolean {
  return pos.x >= 0 && pos.x < size && pos.y >= 0 && pos.y < size;
}

export function newBoard(size: number): TakBoard {
  return {
    size,
    pieces: Array.from<(TakStack | null)[], (TakStack | null)[]>(
      { length: size },
      () => Array(size).fill(null) as (TakStack | null)[],
    ),
    _idCounter: {
      white: { pieces: 0, capstones: 0 },
      black: { pieces: 0, capstones: 0 },
    },
  };
}

export function canPlacePiece(board: TakBoard, pos: TakPos): string | null {
  if (!isValidCoord(board.size, pos))
    return `Invalid place position: ${coordToString(pos)}`;

  const stack = board.pieces[pos.y][pos.x];
  return !stack ? null : 'Position is already occupied';
}

export function placePiece(
  board: TakBoard,
  pos: TakPos,
  player: TakPlayer,
  variant: TakPieceVariant,
): TakActionRecord {
  const err = canPlacePiece(board, pos);
  if (err !== null) {
    throw new Error(`Cannot place: ${err}`);
  }

  const idCounter = board._idCounter[player];

  const trackedPiece: TakTrackedPiece = {
    id: `${player === 'white' ? 'W' : 'B'}/${variant === 'capstone' ? 'C' : 'P'}/${(variant ===
    'capstone'
      ? idCounter.capstones
      : idCounter.pieces
    ).toString()}`,
    player,
  };

  if (variant === 'capstone') idCounter.capstones++;
  else idCounter.pieces++;

  const stack: TakStack = {
    variant,
    composition: [trackedPiece],
  };

  board.pieces[pos.y][pos.x] = stack;

  return {
    type: 'place',
    pos,
    variant,
    affectedPieces: [trackedPiece.id],
  };
}

export function canMovePiece(
  board: TakBoard,
  from: TakPos,
  dir: TakDir,
  drops: number[],
  player: TakPlayer,
): string | null {
  if (!isValidCoord(board.size, from))
    return `Invalid move start position: ${coordToString(from)}`;
  const to = offsetCoord(from, dir, drops.length);
  if (!isValidCoord(board.size, to))
    return `Invalid move end position: ${coordToString(to)}`;
  const take = drops.reduce((acc, drop) => acc + drop, 0);
  if (drops.length === 0 || take === 0) return 'Invalid move';

  const stack = board.pieces[from.y][from.x];
  if (!stack || stack.composition.length < take)
    return 'Not enough pieces to move';
  if (stack.composition[stack.composition.length - 1].player !== player)
    return 'Not your piece';
  const variant = stack.variant;

  for (let i = 0; i < drops.length; i++) {
    const pos = offsetCoord(from, dir, i + 1);
    const stack = board.pieces[pos.y][pos.x];
    const canSmash =
      variant === 'capstone' && i === drops.length - 1 && drops[i] === 1;
    if (stack && stack.variant === 'capstone')
      return 'Cannot move onto capstone';
    if (stack && stack.variant === 'standing' && !canSmash)
      return 'Cannot move onto standing piece';
  }
  return null;
}

export function movePiece(
  board: TakBoard,
  from: TakPos,
  dir: TakDir,
  drops: number[],
  player: TakPlayer,
): TakActionRecord {
  const err = canMovePiece(board, from, dir, drops, player);
  if (err !== null) {
    throw new Error(`Cannot move: ${err}`);
  }
  const take = drops.reduce((acc, drop) => acc + drop, 0);

  const stack = board.pieces[from.y][from.x];
  if (!stack)
    throw new Error('No stack found at move origin. This should never happen');

  const takenPieces = stack.composition.splice(-take);
  const affectedPieces = takenPieces.map((p) => p.id);
  const variant = stack.variant;
  stack.variant = 'flat';

  if (stack.composition.length === 0) {
    board.pieces[from.y][from.x] = null;
  }

  let smash = false;

  for (let i = 0; i < drops.length; i++) {
    const pos = offsetCoord(from, dir, i + 1);
    const stack = board.pieces[pos.y][pos.x];
    const piecesToAdd = takenPieces.splice(0, drops[i]);
    const thisVariant = i === drops.length - 1 ? variant : 'flat';
    if (!stack) {
      board.pieces[pos.y][pos.x] = {
        variant: thisVariant,
        composition: piecesToAdd,
      };
    } else {
      if (stack.variant === 'standing') {
        smash = true;
      }
      stack.variant = thisVariant;
      stack.composition.push(...piecesToAdd);
    }
  }

  return {
    type: 'move',
    from,
    dir,
    drops,
    smash,
    affectedPieces,
  };
}

export function findRoads(board: TakBoard, player: TakPlayer): TakPos[] | null {
  function getOffsetList(pos: TakPos, dir: TakDir, amount: number): TakPos[] {
    const offsets: TakPos[] = [pos];
    for (let i = 1; i < amount; i++) {
      offsets.push(offsetCoord(pos, dir, i));
    }
    return offsets;
  }

  function findRoadsHelper(starts: TakPos[], ends: TakPos[]): TakPos[] | null {
    const visited = new Set<string>();
    const prev = new Map<string, TakPos | null>();
    const queue: TakPos[] = [];
    for (const start of starts) {
      const stack = board.pieces[start.y][start.x];
      if (
        stack &&
        stack.composition.length > 0 &&
        stack.composition[stack.composition.length - 1].player === player &&
        stack.variant !== 'standing'
      ) {
        const key = coordToString(start);
        visited.add(key);
        prev.set(key, null);
        queue.push(start);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) throw new Error('Queue empty. This should never happen');

      if (ends.some((e) => coordEquals(e, current))) {
        const path: TakPos[] = [];
        let node: TakPos | null = current;
        while (node) {
          path.push(node);
          node = prev.get(coordToString(node)) ?? null;
        }
        path.reverse();
        return path;
      }

      const neighbors: TakPos[] = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
      ];

      for (const neighbor of neighbors) {
        const key = coordToString(neighbor);
        if (isValidCoord(board.size, neighbor) && !visited.has(key)) {
          const stack = board.pieces[neighbor.y][neighbor.x];
          if (
            stack &&
            stack.composition.length > 0 &&
            stack.composition[stack.composition.length - 1].player === player &&
            stack.variant !== 'standing'
          ) {
            visited.add(key);
            prev.set(key, current);
            queue.push(neighbor);
          }
        }
      }
    }
    return null;
  }
  const horizontalRoad = findRoadsHelper(
    getOffsetList(newCoord(0, 0), 'up', board.size),
    getOffsetList(newCoord(board.size - 1, 0), 'up', board.size),
  );
  if (horizontalRoad) return horizontalRoad;
  return findRoadsHelper(
    getOffsetList(newCoord(0, 0), 'right', board.size),
    getOffsetList(newCoord(0, board.size - 1), 'right', board.size),
  );
}

export function isFilled(board: TakBoard): boolean {
  for (const row of board.pieces) {
    for (const stack of row) {
      if (!stack) {
        return false;
      }
    }
  }
  return true;
}

export function getFlats(board: TakBoard, player: TakPlayer): TakPos[] {
  const flats: TakPos[] = [];
  for (let y = 0; y < board.size; y++) {
    for (let x = 0; x < board.size; x++) {
      const stack = board.pieces[y][x];
      if (
        stack &&
        stack.variant === 'flat' &&
        stack.composition[stack.composition.length - 1].player === player
      ) {
        flats.push({ x, y });
      }
    }
  }
  return flats;
}

export function countFlats(board: TakBoard): Record<TakPlayer, number> {
  const counts: Record<TakPlayer, number> = { white: 0, black: 0 };
  for (const row of board.pieces) {
    for (const stack of row) {
      if (stack && stack.variant === 'flat') {
        const player = stack.composition[stack.composition.length - 1].player;
        counts[player]++;
      }
    }
  }
  return counts;
}

export function toPositionString(board: TakBoard) {
  function variantToString(variant: TakPieceVariant) {
    switch (variant) {
      case 'flat':
        return '';
      case 'standing':
        return 'S';
      case 'capstone':
        return 'C';
    }
  }

  function rowToPositionString(row: (TakStack | null)[]) {
    const result: string[] = [];
    let emptyCount = 0;

    for (const stack of row) {
      if (stack === null) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          result.push(`x${emptyCount === 1 ? '' : emptyCount.toString()}`);
          emptyCount = 0;
        }
        result.push(
          `${stack.composition
            .map((piece) => (piece.player === 'white' ? '1' : '2'))
            .join('')}${variantToString(stack.variant)}`,
        );
      }
    }

    if (emptyCount > 0) {
      result.push(`x${emptyCount === 1 ? '' : emptyCount.toString()}`);
    }

    return result.join(',');
  }
  return board.pieces.map(rowToPositionString).reverse().join('\n');
}
