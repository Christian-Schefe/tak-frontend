import { Component, computed, effect, input, signal } from '@angular/core';
import { Pipe, PipeTransform } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { TakGameUI } from '../../../tak-core/ui';
import { TakPlayer } from '../../../tak-core';
import { getTimeRemaining } from '../../../tak-core/game';

@Pipe({
  name: 'clockFormat',
  standalone: true,
})
export class ClockFormatPipe implements PipeTransform {
  transform(milliseconds: number): string {
    const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
    const hours = Math.floor((milliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const millis = Math.floor(milliseconds % 1000);
    if (days > 0) {
      const paddedHours = hours.toString().padStart(2, '0');
      return `${days}d ${paddedHours}h`;
    } else if (hours > 0) {
      const paddedMinutes = minutes.toString().padStart(2, '0');
      return `${hours}h ${paddedMinutes}m`;
    } else if (minutes > 0 || seconds >= 10) {
      const paddedMinutes = minutes.toString().padStart(2, '0');
      const paddedSeconds = seconds.toString().padStart(2, '0');
      return `${paddedMinutes}:${paddedSeconds}`;
    } else {
      const paddedSeconds = seconds.toString().padStart(2, '0');
      const paddedMilliseconds = millis.toString().padStart(3, '0');
      return `${paddedSeconds}.${paddedMilliseconds}`;
    }
  }
}

@Component({
  selector: 'app-game-clock',
  imports: [ClockFormatPipe, TagModule],
  templateUrl: './game-clock.html',
  styleUrl: './game-clock.css',
})
export class GameClock {
  game = input.required<TakGameUI>();
  player = input.required<TakPlayer>();
  updateClock = signal(0);

  clockInfo = computed(() => {
    this.updateClock();
    const player = this.player();
    const game = this.game();
    const remainingMs = getTimeRemaining(game.actualGame, player, new Date());
    const isActive =
      player === game.actualGame.currentPlayer && game.actualGame.gameState.type === 'ongoing';
    return { remainingMs, isActive };
  });

  private readonly _tick = effect((onCleanup) => {
    const id = setInterval(() => {
      this.updateClock.update((n) => n + 1);
    }, 100);

    onCleanup(() => clearInterval(id));
  });
}
