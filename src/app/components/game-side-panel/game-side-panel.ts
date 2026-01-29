import { Component, computed, effect, input, output, viewChild } from '@angular/core';
import { CardModule } from 'primeng/card';
import { canUndoMove, TakGameUI } from '../../../tak-core/ui';
import { moveRecordToString } from '../../../tak-core/move';
import { ScrollPanel, ScrollPanelModule } from 'primeng/scrollpanel';
import { gameResultToString } from '../../../tak-core/game';
import { ButtonModule } from 'primeng/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFlag, lucideHandshake, lucideUndo } from '@ng-icons/lucide';
import { GameRequest } from '../game-request/game-request';
import { GameRequestType } from '../../services/game-service/game-service';

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
  selector: 'app-game-side-panel',
  imports: [CardModule, ScrollPanelModule, ButtonModule, NgIcon, GameRequest],
  templateUrl: './game-side-panel.html',
  styleUrl: './game-side-panel.css',
  viewProviders: [provideIcons({ lucideFlag, lucideHandshake, lucideUndo })],
})
export class GameSidePanel {
  game = input.required<TakGameUI>();
  setHistoryPlyIndex = output<number>();
  requests = input.required<GameRequestType[]>();
  drawOffer = input.required<number | null>();
  undoRequest = input.required<number | null>();
  requestDraw = output();
  requestUndo = output();
  retractRequest = output<number>();
  requestDecision = output<{ requestId: number; decision: 'accept' | 'reject' }>();
  resign = output();

  canUndo = computed(() => {
    const game = this.game();
    return canUndoMove(game);
  });

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

  hasUndoRequest = computed(() => {
    return this.undoRequest() !== null;
  });

  hasDrawOffer = computed(() => {
    return this.drawOffer() !== null;
  });

  onClickUndo() {
    const requestId = this.undoRequest();
    if (requestId !== null) {
      this.retractRequest.emit(requestId);
    } else {
      this.requestUndo.emit();
    }
  }

  onClickDraw() {
    const requestId = this.drawOffer();
    if (requestId !== null) {
      this.retractRequest.emit(requestId);
    } else {
      this.requestDraw.emit();
    }
  }
}
