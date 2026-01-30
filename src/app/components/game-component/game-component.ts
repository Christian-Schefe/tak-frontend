import { Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { BoardNinjaComponent } from '../board-ninja-component/board-ninja-component';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { GamePlayerBar } from '../game-player-bar/game-player-bar';
import { TakAction, TakGameState, TakPieceVariant, TakPlayer, TakPos } from '../../../tak-core';
import { TakGameUI } from '../../../tak-core/ui';
import { GameSidePanel } from '../game-side-panel/game-side-panel';
import { GameChatPanel } from '../game-chat-panel/game-chat-panel';
import { BoardNativeComponent } from '../board-native/board-native-component/board-native-component';
import { GameRequestType } from '../../services/game-service/game-service';
import { IdentityService } from '../../services/identity-service/identity-service';
import { SettingsService } from '../../services/settings-service/settings-service';
import { BoardNgtComponent } from '../board-ng-three/board-ngt-component/board-ngt-component';

export type GameMode =
  | { type: 'local' }
  | { type: 'online'; localPlayer: TakPlayer }
  | { type: 'spectator' };

export type GamePlayer =
  | {
      type: 'player';
      playerId: string;
    }
  | {
      type: 'local';
      name: string;
    };

export type BoardStyle = 'ninja' | '2d' | '3d';

export type TakActionEvent =
  | {
      type: 'full';
      action: TakAction;
    }
  | {
      type: 'partial';
      pos: TakPos;
      variant: TakPieceVariant | null;
    };

@Component({
  selector: 'app-game-component',
  imports: [
    BoardNinjaComponent,
    ButtonModule,
    DialogModule,
    GamePlayerBar,
    GameSidePanel,
    GameChatPanel,
    BoardNativeComponent,
    BoardNgtComponent,
  ],
  templateUrl: './game-component.html',
  styleUrl: './game-component.css',
})
export class GameComponent {
  game = input.required<TakGameUI>();
  action = output<TakActionEvent>();
  mode = input.required<GameMode>();
  players = input.required<Record<TakPlayer, GamePlayer>>();
  setHistoryPlyIndex = output<number>();
  requests = input.required<GameRequestType[]>();
  requestDraw = output();
  requestUndo = output();
  retractRequest = output<number>();
  resign = output();
  settingsService = inject(SettingsService);
  requestDecision = output<{ requestId: number; decision: 'accept' | 'reject' }>();

  identityService = inject(IdentityService);

  playerOrder = computed<{ p1: TakPlayer; p2: TakPlayer }>(() => {
    const mode = this.mode();
    if (mode.type === 'online' && mode.localPlayer === 'black') {
      return { p1: 'black', p2: 'white' };
    }
    return { p1: 'white', p2: 'black' };
  });

  gameStateTrigger = computed<TakGameState>(() => {
    return this.game().actualGame.gameState;
  });
  showGameOverInfo = linkedSignal(() => {
    return this.gameStateTrigger().type !== 'ongoing';
  });

  opponentRequests = computed<GameRequestType[]>(() => {
    const identity = this.identityService.identity();
    const gameState = this.gameStateTrigger();
    if (!identity || gameState.type !== 'ongoing') {
      return [];
    }
    const opponentRequests = this.requests().filter(
      (request) => request.fromPlayerId !== identity.playerId,
    );
    console.log('opponentRequests', opponentRequests);
    return opponentRequests;
  });

  myDrawOffer = computed<number | null>(() => {
    const identity = this.identityService.identity();
    if (!identity) {
      return null;
    }
    const drawRequest = this.requests().find(
      (request) =>
        request.requestType.type === 'draw' && request.fromPlayerId === identity.playerId,
    );
    return drawRequest ? drawRequest.id : null;
  });

  myUndoRequest = computed<number | null>(() => {
    const identity = this.identityService.identity();
    if (!identity) {
      return null;
    }
    const undoRequest = this.requests().find(
      (request) =>
        request.requestType.type === 'undo' && request.fromPlayerId === identity.playerId,
    );
    return undoRequest ? undoRequest.id : null;
  });
}
