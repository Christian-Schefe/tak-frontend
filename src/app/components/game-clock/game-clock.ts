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
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
