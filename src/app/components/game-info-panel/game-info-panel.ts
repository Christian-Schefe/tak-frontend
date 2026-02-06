import { Component, computed, effect, input, output, viewChild } from '@angular/core';
import { TakGameUI } from '../../../tak-core/ui';
import { moveRecordToString } from '../../../tak-core/move';
import { ScrollPanel, ScrollPanelModule } from 'primeng/scrollpanel';
import { gameResultToString } from '../../../tak-core/game';
import { provideIcons } from '@ng-icons/core';
import { lucideFlag, lucideHandshake, lucideInfo, lucideUndo } from '@ng-icons/lucide';
import { GameRequest } from '../game-request/game-request';
import { GameRequestType } from '../../services/game-service/game-service';
import { ConfirmationService } from 'primeng/api';

type HistoryEntry =
  | {
      type: 'moveNumber' | 'gameResult';
      text: string;
    }
  | {
      type: 'whiteMove' | 'blackMove';
      text: string;
      plyIndex: number;
      active: boolean;
    };

@Component({
  selector: 'app-game-info-panel',
  imports: [ScrollPanelModule, GameRequest],
  templateUrl: './game-info-panel.html',
  styleUrl: './game-info-panel.css',
  viewProviders: [provideIcons({ lucideFlag, lucideHandshake, lucideUndo, lucideInfo })],
  providers: [ConfirmationService],
})
export class GameInfoPanel {
  game = input.required<TakGameUI>();
  setHistoryPlyIndex = output<number>();
  requests = input.required<GameRequestType[]>();
  requestDecision = output<{ requestId: number; decision: 'accept' | 'reject' }>();

  private gamePlyIndex = computed(
    () => this.game().plyIndex ?? this.game().actualGame.history.length,
  );

  private gameHistory = computed(() => this.game().actualGame.history);

  gameState = computed(() => this.game().actualGame.gameState);

  historyItems = computed(() => {
    const curPlyIndex = this.gamePlyIndex();
    const history = this.gameHistory();
    const gameState = this.gameState();
    const items: HistoryEntry[][] = [];
    for (let i = 0; i < history.length; i += 2) {
      const row: HistoryEntry[] = [];
      const whiteMove = history[i];
      const blackMove = i + 1 < history.length ? history[i + 1] : undefined;
      row.push({ type: 'moveNumber', text: `${(i / 2 + 1).toString()}.` });
      const whitePlyIndex = i + 1 === curPlyIndex ? i : i + 1;
      row.push({
        type: 'whiteMove',
        text: moveRecordToString(whiteMove),
        plyIndex: whitePlyIndex,
        active: whitePlyIndex < curPlyIndex,
      });
      if (blackMove !== undefined) {
        const blackPlyIndex = i + 2 === curPlyIndex ? i + 1 : i + 2;
        row.push({
          type: 'blackMove',
          text: moveRecordToString(blackMove),
          plyIndex: blackPlyIndex,
          active: blackPlyIndex < curPlyIndex,
        });
      }
      items.push(row);
    }
    if (gameState.type !== 'ongoing') {
      const row: HistoryEntry[] = [];
      row.push({ type: 'moveNumber', text: '' });
      row.push({ type: 'gameResult', text: gameResultToString(gameState) ?? '' });
      items.push(row);
    }
    return items;
  });

  input = viewChild.required(ScrollPanel);

  private readonly _scrollHistoryEffect = effect(() => {
    this.historyItems();
    setTimeout(() => {
      this.input().scrollTop(Infinity);
    }, 0);
  });
}
