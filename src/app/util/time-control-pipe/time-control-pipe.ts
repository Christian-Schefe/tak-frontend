import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeControl',
})
export class TimeControlPipe implements PipeTransform {
  transform({ contingentMs, incrementMs }: { contingentMs: number; incrementMs: number }): string {
    const minutes = Math.floor(contingentMs / 60000);
    const seconds = Math.floor((contingentMs % 60000) / 1000);
    const incrementSeconds = Math.floor(incrementMs / 1000);
    const paddedSeconds = seconds.toString().padStart(2, '0');
    return `${minutes}:${paddedSeconds} + ${incrementSeconds}s`;
  }
}
