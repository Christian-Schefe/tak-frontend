import { Component, input, output } from '@angular/core';
import { GameRequestType } from '../../services/game-service/game-service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-game-request',
  imports: [ButtonModule],
  templateUrl: './game-request.html',
  styleUrl: './game-request.css',
})
export class GameRequest {
  request = input.required<GameRequestType>();
  decision = output<'accept' | 'reject'>();
}
