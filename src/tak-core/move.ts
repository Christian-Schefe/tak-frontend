import type { TakDir, TakAction, TakActionRecord, TakPieceVariant } from '.';

export function moveFromString(str: string): TakAction {
  function stringToVariant(variant: string): TakPieceVariant {
    switch (variant) {
      case 'S':
        return 'standing';
      case 'C':
        return 'capstone';
      case 'F':
        return 'flat';
      default:
        throw new Error(`Invalid piece variant: ${variant}`);
    }
  }
  function stringToDir(dir: string): TakDir {
    switch (dir) {
      case '>':
        return 'right';
      case '<':
        return 'left';
      case '+':
        return 'up';
      case '-':
        return 'down';
      default:
        throw new Error(`Invalid direction: ${dir}`);
    }
  }

  const moveRegex = /^([1-9]?)([a-z])([1-9])([<>+-])([1-9]*)/;
  const moveMatch = moveRegex.exec(str);
  if (moveMatch) {
    const take = moveMatch[1] ? moveMatch[1].charCodeAt(0) - '0'.charCodeAt(0) : 1;
    const x = moveMatch[2].charCodeAt(0) - 'a'.charCodeAt(0);
    const y = moveMatch[3].charCodeAt(0) - '1'.charCodeAt(0);
    const dir = stringToDir(moveMatch[4]);
    const drops = moveMatch[5]
      ? moveMatch[5].split('').map((d) => d.charCodeAt(0) - '0'.charCodeAt(0))
      : [take];
    return { type: 'move', from: { x, y }, dir, drops };
  }

  const placeRegex = /^([FSC]?)([a-z])([1-9])/;
  const placeMatch = placeRegex.exec(str);
  if (placeMatch) {
    const variant = stringToVariant(placeMatch[1] || 'F');
    const x = placeMatch[2].charCodeAt(0) - 'a'.charCodeAt(0);
    const y = placeMatch[3].charCodeAt(0) - '1'.charCodeAt(0);
    return { type: 'place', variant, pos: { x, y } };
  }

  throw new Error(`Invalid move string: ${str}`);
}

export function moveToString(move: TakAction): string {
  if (move.type === 'place') {
    const variant = move.variant === 'capstone' ? 'C' : move.variant === 'standing' ? 'S' : '';

    const col = String.fromCharCode(move.pos.x + 'a'.charCodeAt(0));
    const row = move.pos.y + 1;
    return `${variant}${col}${row.toString()}`;
  } else {
    const col = String.fromCharCode(move.from.x + 'a'.charCodeAt(0));
    const row = move.from.y + 1;
    const dir =
      move.dir === 'up' ? '+' : move.dir === 'down' ? '-' : move.dir === 'left' ? '<' : '>';
    const takeSum = move.drops.reduce((a, b) => a + b, 0);
    const take = takeSum === 1 ? '' : takeSum.toString();
    const drops = move.drops.length === 1 ? '' : move.drops.join('');
    return `${take}${col}${row.toString()}${dir}${drops}`;
  }
}

export function moveRecordToString(move: TakActionRecord): string {
  if (move.type === 'place') {
    return moveToString(move);
  } else {
    const smash = move.smash ? '*' : '';
    return `${moveToString(move)}${smash}`;
  }
}
