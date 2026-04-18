import { Component, computed, inject, input, output } from '@angular/core';
import { BoardNgtComponent } from '../board-ng-three/board-ngt-component/board-ngt-component';
import { BoardNativeComponent } from '../board-native/board-native-component/board-native-component';
import { BoardNinjaComponent } from '../board-ninja-component/board-ninja-component';
import { GameMode } from '../game-component/game-component';
import { SettingsService } from '../../services/settings-service/settings-service';
import { TakAction, TakBaseGame } from '../../../tak-core';

@Component({
  selector: 'app-game-board',
  imports: [BoardNgtComponent, BoardNativeComponent, BoardNinjaComponent],
  templateUrl: './game-board.html',
  styleUrl: './game-board.css',
})
export class GameBoard {
  game = input.required<TakBaseGame>();
  plyIndex = input.required<number | null>();
  action = output<TakAction>();
  mode = input.required<GameMode>();

  private settingsService = inject(SettingsService);

  boardType = computed(() => this.settingsService.generalSettings().boardType);
}
