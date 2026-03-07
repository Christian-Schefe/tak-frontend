import { Component, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { GamesTableComponent } from '../../components/games-table-component/games-table-component';
import { GameService } from '../../services/game-service/game-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-seeks-route',
  imports: [CardModule, TabsModule, GamesTableComponent],
  templateUrl: './watch-route.html',
  styleUrl: './watch-route.css',
})
export class WatchRoute {
  private gameService = inject(GameService);
  private router = inject(Router);
  games = this.gameService.games;

  onViewGame(gameId: number) {
    void this.router.navigate(['/online', gameId.toString()]);
  }
}
