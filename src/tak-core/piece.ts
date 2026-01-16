import type { TakReserve } from '.';

export function getDefaultReserve(size: number): TakReserve {
  if (size === 3) return { pieces: 10, capstones: 0 };
  if (size === 4) return { pieces: 15, capstones: 0 };
  if (size === 5) return { pieces: 21, capstones: 1 };
  if (size === 6) return { pieces: 30, capstones: 1 };
  if (size === 7) return { pieces: 40, capstones: 2 };
  if (size === 8) return { pieces: 50, capstones: 2 };
  throw new Error(`Invalid board size: ${size.toString()}`);
}
