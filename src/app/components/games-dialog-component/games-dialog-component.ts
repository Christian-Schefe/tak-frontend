import { Component, inject, Injector, model } from '@angular/core';
import { GameInfo, GameService } from '../../services/game-service/game-service';
import { PlayerService } from '../../services/player-service/player-service';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { PlayerLabel } from '../player-label/player-label';

@Component({
  selector: 'app-games-dialog-component',
  imports: [DialogModule, TableModule, PlayerLabel],
  templateUrl: './games-dialog-component.html',
  styleUrl: './games-dialog-component.css',
})
export class GamesDialogComponent {
  gameService = inject(GameService);
  playerService = inject(PlayerService);
  visible = model.required<boolean>();
  injector = inject(Injector);

  trackBy(game: { id: string }) {
    return game.id;
  }

  asGame(game: unknown): GameInfo {
    return game as GameInfo;
  }

  playerInfos = this.playerService.getComputedPlayerInfos(() => {
    return this.gameService.games().flatMap((game) => [game.whiteId, game.blackId]);
  });
}
