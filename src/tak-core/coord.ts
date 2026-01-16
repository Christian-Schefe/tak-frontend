import type { TakPos, TakDir } from '.';

export function offsetCoord(pos: TakPos, dir: TakDir, amount: number): TakPos {
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

export function newCoord(x: number, y: number): TakPos {
  return { x, y };
}

export function coordToString(coord: TakPos): string {
  return `${coord.x.toString()},${coord.y.toString()}`;
}

export function coordEquals(a: TakPos, b: TakPos): boolean {
  return a.x === b.x && a.y === b.y;
}

export function dirToString(dir: TakDir) {
  switch (dir) {
    case 'up':
      return '+';
    case 'down':
      return '-';
    case 'left':
      return '<';
    case 'right':
      return '>';
  }
}

export function dirFromAdjacent(to: TakPos, from: TakPos): TakDir | null {
  if (to.x === from.x && to.y === from.y + 1) return 'up';
  if (to.x === from.x && to.y === from.y - 1) return 'down';
  if (to.y === from.y && to.x === from.x + 1) return 'right';
  if (to.y === from.y && to.x === from.x - 1) return 'left';
  return null;
}
export function dirFromAligned(to: TakPos, from: TakPos): TakDir | null {
  if (to.x === from.x && to.y > from.y) return 'up';
  if (to.x === from.x && to.y < from.y) return 'down';
  if (to.y === from.y && to.x > from.x) return 'right';
  if (to.y === from.y && to.x < from.x) return 'left';
  return null;
}
