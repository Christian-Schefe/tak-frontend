import { Component, inject, model } from '@angular/core';
import { GameService } from '../../services/game-service/game-service';
import { PlayerService } from '../../services/player-service/player-service';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { PlayerLabel } from '../player-label/player-label';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye } from '@ng-icons/lucide';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { GameInfo } from '../../services/game-history-service/game-history-service';

@Component({
  selector: 'app-games-dialog-component',
  imports: [DialogModule, TableModule, PlayerLabel, NgIcon, ButtonModule, RippleModule],
  templateUrl: './games-dialog-component.html',
  styleUrl: './games-dialog-component.css',
  viewProviders: [provideIcons({ lucideEye })],
})
export class GamesDialogComponent {
  gameService = inject(GameService);
  playerService = inject(PlayerService);
  visible = model.required<boolean>();
  router = inject(Router);

  trackBy(game: { id: string }) {
    return game.id;
  }

  asGame(game: unknown): GameInfo {
    return game as GameInfo;
  }

  onViewGame(gameId: number) {
    void this.router.navigate(['/app/online', gameId.toString()]);
    this.visible.set(false);
  }
}
