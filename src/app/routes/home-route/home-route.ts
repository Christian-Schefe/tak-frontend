import { Component, inject } from '@angular/core';
import { TableModule } from 'primeng/table';
import { GameService } from '../../services/game-service/game-service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { PlayerLabel } from '../../components/player-label/player-label';

@Component({
  selector: 'app-home-route',
  imports: [TableModule, CardModule, ButtonModule, RouterLink, PlayerLabel],
  templateUrl: './home-route.html',
  styleUrl: './home-route.css',
})
export class HomeRoute {
  gameService = inject(GameService);
}
