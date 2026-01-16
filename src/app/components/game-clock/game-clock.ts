import { Component, computed, input, OnDestroy, OnInit, signal } from '@angular/core';
import { Pipe, PipeTransform } from '@angular/core';
import { interval, Subscription } from 'rxjs';
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
export class GameClock implements OnInit, OnDestroy {
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

  private sub: Subscription | undefined;

  ngOnInit() {
    this.sub = interval(100).subscribe(() => {
      this.updateClock.update((n) => n + 1);
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
