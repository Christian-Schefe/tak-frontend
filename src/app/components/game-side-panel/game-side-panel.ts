import { Component, computed, effect, input, ViewChild } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TakGameUI } from '../../../tak-core/ui';
import { moveRecordToString } from '../../../tak-core/move';
import { ScrollPanel, ScrollPanelModule } from 'primeng/scrollpanel';
import { gameResultToString } from '../../../tak-core/game';

interface HistoryEntry {
  type: 'moveNumber' | 'whiteMove' | 'blackMove' | 'gameResult';
  text: string;
}

@Component({
  selector: 'app-game-side-panel',
  imports: [CardModule, ScrollPanelModule],
  templateUrl: './game-side-panel.html',
  styleUrl: './game-side-panel.css',
})
export class GameSidePanel {
  game = input.required<TakGameUI>();

  historyItems = computed(() => {
    const game = this.game();
    const history = game.actualGame.history;
    const items: HistoryEntry[][] = [];
    for (let i = 0; i < history.length; i += 2) {
      const row: HistoryEntry[] = [];
      const whiteMove = history[i];
      const blackMove = i + 1 < history.length ? history[i + 1] : undefined;
      row.push({ type: 'moveNumber', text: `${i / 2 + 1}.` });
      row.push({ type: 'whiteMove', text: moveRecordToString(whiteMove) });
      if (blackMove !== undefined) {
        row.push({
          type: 'blackMove',
          text: moveRecordToString(blackMove),
        });
      }
      items.push(row);
    }
    if (game.actualGame.gameState.type !== 'ongoing') {
      const row: HistoryEntry[] = [];
      row.push({ type: 'moveNumber', text: '' });
      row.push({ type: 'gameResult', text: gameResultToString(game.actualGame.gameState) ?? '' });
      items.push(row);
    }
    return items;
  });

  @ViewChild(ScrollPanel) input: ScrollPanel | undefined;

  private readonly _scrollHistoryEffect = effect(() => {
    this.historyItems();
    setTimeout(() => {
      if (this.input) {
        this.input.scrollTop(Infinity);
      }
    }, 0);
  });
}
