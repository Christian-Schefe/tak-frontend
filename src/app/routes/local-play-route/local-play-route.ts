import { Component, computed, effect, inject, linkedSignal } from '@angular/core';
import {
  GameComponent,
  GamePlayer,
  TakActionEvent,
} from '../../components/game-component/game-component';

import { TakAction, TakPlayer, TakPos } from '../../../tak-core';
import {
  checkTimeout,
  doMove,
  TakGameUI,
  newGameUI,
  setPlyIndex,
  doDraw,
  doResign,
  undoMove,
  updatePartialMove,
  tryPlaceOrAddToPartialMove,
} from '../../../tak-core/ui';
import { newGame } from '../../../tak-core/game';
import { GameService } from '../../services/game-service/game-service';
import { produce } from 'immer';

@Component({
  selector: 'app-local-play-route',
  imports: [GameComponent],
  templateUrl: './local-play-route.html',
  styleUrl: './local-play-route.css',
})
export class LocalPlayRoute {
  gameService = inject(GameService);
  game = linkedSignal<TakGameUI>(() => {
    return newGameUI(newGame(this.gameService.localGameSettings()));
  });
  players = computed<Record<TakPlayer, GamePlayer>>(() => {
    return {
      white: { type: 'local', name: 'Player 1' },
      black: { type: 'local', name: 'Player 2' },
    };
  });

  private readonly _timeoutEffect = effect((onCleanup) => {
    const id = setInterval(() => {
      this.game.update((game) => {
        return produce(game, (game) => {
          if (game.actualGame.gameState.type !== 'ongoing') {
            return;
          }
          checkTimeout(game);
        });
      });
    }, 300);

    onCleanup(() => {
      clearInterval(id);
    });
  });

  onAction(action: TakActionEvent) {
    this.game.update((game) => {
      let move: TakAction | null = null;
      let pos: TakPos | null = null;
      if (action.type === 'full') {
        move = action.action;
      } else {
        move = tryPlaceOrAddToPartialMove(game, action.pos, action.variant);
        pos = action.pos;
      }

      return produce(game, (game) => {
        if (move !== null) {
          doMove(game, move);
        } else if (pos !== null) {
          updatePartialMove(game, pos);
        }
      });
    });
  }

  onSetHistoryPlyIndex(plyIndex: number) {
    this.game.update((game) => {
      return produce(game, (game) => {
        setPlyIndex(game, plyIndex);
      });
    });
  }

  onRequestDraw() {
    this.game.update((game) => {
      return produce(game, (game) => {
        doDraw(game);
      });
    });
  }

  onRequestUndo() {
    this.game.update((game) => {
      return produce(game, (game) => {
        undoMove(game);
      });
    });
  }

  onResign() {
    this.game.update((game) => {
      return produce(game, (game) => {
        doResign(game, game.actualGame.currentPlayer);
      });
    });
  }
}
