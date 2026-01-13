import { Component, computed, inject, model } from '@angular/core';
import { GameInfo, GameService } from '../../services/game-service/game-service';
import { PlayerInfo, PlayerService } from '../../services/player-service/player-service';
import { HttpResourceRef } from '@angular/common/http';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-games-dialog-component',
  imports: [DialogModule, TableModule],
  templateUrl: './games-dialog-component.html',
  styleUrl: './games-dialog-component.css',
})
export class GamesDialogComponent {
  gameService = inject(GameService);
  playerService = inject(PlayerService);
  visible = model(false);

  trackBy(game: { id: string }) {
    return game.id;
  }

  asGame(game: unknown): GameInfo {
    return game as GameInfo;
  }

  playerInfos = computed(() => {
    const players = this.gameService
      .games()
      .flatMap((game) => [game.whiteId, game.blackId])
      .filter((id): id is string => !!id);
    const map: Record<string, HttpResourceRef<PlayerInfo | undefined>> = {};
    for (const playerId of players) {
      const resource = this.playerService.getPlayerInfo(playerId);
      map[playerId] = resource;
    }
    return map;
  });
}
