import { Pipe, PipeTransform } from '@angular/core';
import { GameSettings } from '../../services/game-service/game-service';

@Pipe({
  name: 'timeControl',
})
export class TimeControlPipe implements PipeTransform {
  transform(settings: GameSettings['timeSettings']): string {
    if (settings.type === 'realtime') {
      let res = `${timeFormat(settings.contingentMs)} + ${timeFormat(settings.incrementMs)}`;
      if (settings.extra) {
        res += ` (+ ${timeFormat(settings.extra.extraMs)} @ move ${settings.extra.onMove.toString()})`;
      }
      return res;
    } else {
      return `${timeFormat(settings.contingentMs)} per move`;
    }
  }
}

export function timeFormat(milliseconds: number): string {
  const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
  const hours = Math.floor((milliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const millis = milliseconds % 1000;
  const parts = [];
  if (days > 0) {
    parts.push(`${days.toString()} ${days === 1 ? 'day' : 'days'}`);
  }
  if (hours > 0) {
    parts.push(`${hours.toString()} ${hours === 1 ? 'hr' : 'hrs'}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes.toString()} min`);
  }
  if (seconds > 0) {
    parts.push(`${seconds.toString()} s`);
  }
  if (millis > 0 || parts.length === 0) {
    parts.push(`${millis.toString()} ms`);
  }
  return parts.join(' ');
}
