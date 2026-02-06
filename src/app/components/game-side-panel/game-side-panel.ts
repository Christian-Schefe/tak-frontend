import { Component, input, output } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TakGameUI } from '../../../tak-core/ui';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ButtonModule } from 'primeng/button';
import { GameRequestType } from '../../services/game-service/game-service';
import { GameChatPanel } from '../game-chat-panel/game-chat-panel';
import { GameInfoPanel } from '../game-info-panel/game-info-panel';
import { DividerModule } from 'primeng/divider';
import { GameActionsPanel } from '../game-actions-panel/game-actions-panel';

@Component({
  selector: 'app-game-side-panel',
  imports: [
    CardModule,
    ScrollPanelModule,
    ButtonModule,
    GameChatPanel,
    GameInfoPanel,
    DividerModule,
    GameActionsPanel,
  ],
  templateUrl: './game-side-panel.html',
  styleUrl: './game-side-panel.css',
})
export class GameSidePanel {
  game = input.required<TakGameUI>();
  requests = input.required<GameRequestType[]>();
  drawOffer = input.required<number | null>();
  undoRequest = input.required<number | null>();
  setHistoryPlyIndex = output<number>();
  requestDraw = output();
  requestUndo = output();
  retractRequest = output<number>();
  requestDecision = output<{ requestId: number; decision: 'accept' | 'reject' }>();
  resign = output();
}
