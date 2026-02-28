import { Component, computed, inject, input, output } from '@angular/core';
import { BoardNgtComponent } from '../board-ng-three/board-ngt-component/board-ngt-component';
import { BoardNativeComponent } from '../board-native/board-native-component/board-native-component';
import { BoardNinjaComponent } from '../board-ninja-component/board-ninja-component';
import { GameMode, TakActionEvent } from '../game-component/game-component';
import { TakGameUI } from '../../../tak-core/ui';
import { SettingsService } from '../../services/settings-service/settings-service';

@Component({
  selector: 'app-game-board',
  imports: [BoardNgtComponent, BoardNativeComponent, BoardNinjaComponent],
  templateUrl: './game-board.html',
  styleUrl: './game-board.css',
})
export class GameBoard {
  game = input.required<TakGameUI>();
  action = output<TakActionEvent>();
  mode = input.required<GameMode>();

  private settingsService = inject(SettingsService);

  boardType = computed(() => this.settingsService.generalSettings().boardType);
}
