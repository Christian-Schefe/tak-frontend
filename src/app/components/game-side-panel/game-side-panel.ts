import { Component, computed, effect, input, ViewChild } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TakGameUI } from '../../../tak-core/ui';
import { moveRecordToString } from '../../../tak-core/move';
import { TakPlayer } from '../../../tak-core';
import { ScrollPanel, ScrollPanelModule } from 'primeng/scrollpanel';

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
    const items: ({ color: TakPlayer; move: string } | undefined)[] = [];
    for (let i = 0; i < history.length; i += 2) {
      const whiteMove = history[i];
      const blackMove = i + 1 < history.length ? history[i + 1] : undefined;
      items.push({
        color: i == 0 ? 'black' : 'white',
        move: moveRecordToString(whiteMove),
      });
      if (blackMove !== undefined) {
        items.push({
          color: i == 0 ? 'white' : 'black',
          move: moveRecordToString(blackMove),
        });
      }
    }
    for (let i = items.length; i < 2; i++) {
      items.push(undefined);
    }
    return items;
  });

  @ViewChild(ScrollPanel) input: ScrollPanel | undefined;

  constructor() {
    effect(() => {
      this.historyItems();
      setTimeout(() => {
        if (this.input) {
          this.input.scrollTop(Infinity);
        }
      }, 0);
    });
  }
}
