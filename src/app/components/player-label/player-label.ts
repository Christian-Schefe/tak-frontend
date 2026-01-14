import { Component, input } from '@angular/core';
import { PlayerInfo } from '../../services/player-service/player-service';
import { RouterLink } from '@angular/router';
import { RoundPipe } from '../../util/round-pipe/round-pipe';

@Component({
  selector: 'app-player-label',
  imports: [RouterLink, RoundPipe],
  templateUrl: './player-label.html',
  styleUrl: './player-label.css',
})
export class PlayerLabel {
  playerInfo = input.required<PlayerInfo>();
}
