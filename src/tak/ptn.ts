import { TakAction, TakDir, TakPos } from '.';

export function takActionToString(action: TakAction): string {
  if (action.type === 'place') {
    const variantChar = action.variant === 'flat' ? '' : action.variant === 'standing' ? 'S' : 'C';
    const posStr = takPosToString(action.pos);
    return `${variantChar}${posStr}`;
  } else {
    const takeNum = action.drops.reduce((a, b) => a + b, 0);
    const takeStr = takeNum > 1 ? takeNum.toString() : '';
    const posStr = takPosToString(action.pos);
    const dirStr = takDirToString(action.dir);
    const dropsStr = action.drops.length > 1 ? action.drops.join('') : '';
    return `${takeStr}${posStr}${dirStr}${dropsStr}`;
  }
}

function takPosToString(pos: TakPos): string {
  const colChar = String.fromCharCode('a'.charCodeAt(0) + pos.x);
  const rowChar = (pos.y + 1).toString();
  return `${colChar}${rowChar}`;
}

function takDirToString(dir: TakDir): string {
  return dir === 'up' ? '+' : dir === 'down' ? '-' : dir === 'left' ? '<' : '>';
}

export function takActionFromString(actionStr: string): TakAction {
  const placeRegex = /^([SC]?)([a-z])([1-9][0-9]?)$/;
  const moveRegex = /^(?:(\d+))?([a-z])([1-9][0-9]?)([+\-<>])(\d*)\*?$/;
  const placeMatch = actionStr.match(placeRegex);
  if (placeMatch) {
    const variantChar = placeMatch[1];
    const variant = variantChar === 'S' ? 'standing' : variantChar === 'C' ? 'capstone' : 'flat';
    const x = placeMatch[2].charCodeAt(0) - 'a'.charCodeAt(0);
    const y = parseInt(placeMatch[3], 10) - 1;
    return { type: 'place', pos: { x, y }, variant };
  }
  const moveMatch = actionStr.match(moveRegex);
  if (moveMatch) {
    const takeNum = moveMatch[1] ? parseInt(moveMatch[1], 10) : 1;
    const x = moveMatch[2].charCodeAt(0) - 'a'.charCodeAt(0);
    const y = parseInt(moveMatch[3], 10) - 1;
    const dirChar = moveMatch[4];
    const dir =
      dirChar === '+' ? 'up' : dirChar === '-' ? 'down' : dirChar === '<' ? 'left' : 'right';
    const dropsStr = moveMatch[5];
    const drops: number[] = [];
    if (dropsStr.length > 0) {
      for (const c of dropsStr) {
        drops.push(parseInt(c, 10));
      }
    } else {
      drops.push(takeNum);
    }
    return { type: 'move', pos: { x, y }, dir, drops };
  }
  throw new Error(`Invalid Tak action string: ${actionStr}`);
}
