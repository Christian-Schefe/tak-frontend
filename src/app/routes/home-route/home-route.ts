import { Component, inject } from '@angular/core';
import { GameService } from '../../services/game-service/game-service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { PlayerLabel } from '../../components/player-label/player-label';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-home-route',
  imports: [CardModule, ButtonModule, RouterLink, PlayerLabel, RippleModule],
  templateUrl: './home-route.html',
  styleUrl: './home-route.css',
})
export class HomeRoute {
  gameService = inject(GameService);
}
