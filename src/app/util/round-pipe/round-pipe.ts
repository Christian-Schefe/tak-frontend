import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'round',
})
export class RoundPipe implements PipeTransform {
  transform(value: unknown): unknown {
    if (typeof value !== 'number') {
      return value;
    }
    return Math.round(value);
  }
}
