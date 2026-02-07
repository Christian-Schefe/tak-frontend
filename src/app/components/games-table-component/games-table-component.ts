import { Component, input, output } from '@angular/core';
import { TableModule } from 'primeng/table';
import { PlayerLabel } from '../player-label/player-label';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye } from '@ng-icons/lucide';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { GameInfo } from '../../services/game-history-service/game-history-service';

@Component({
  selector: 'app-games-table-component',
  imports: [TableModule, PlayerLabel, NgIcon, ButtonModule, RippleModule],
  templateUrl: './games-table-component.html',
  styleUrl: './games-table-component.css',
  viewProviders: [provideIcons({ lucideEye })],
})
export class GamesTableComponent {
  games = input.required<GameInfo[]>();
  viewGame = output<number>();

  trackBy(game: { id: string }) {
    return game.id;
  }

  asGame(game: unknown): GameInfo {
    return game as GameInfo;
  }
}
