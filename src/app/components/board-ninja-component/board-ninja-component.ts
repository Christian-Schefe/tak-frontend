import {
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import z from 'zod';
import { GameMode, TakActionEvent } from '../game-component/game-component';
import { TakGameUI } from '../../../tak-core/ui';
import { moveFromString } from '../../../tak-core/move';
import { gameToPTN } from '../../../tak-core/ptn';

const params =
  '&moveNumber=false&unplayedPieces=true&disableStoneCycling=true&showBoardPrefsBtn=false&disableNavigation=true&disablePTN=true&disableText=true&flatCounts=false&turnIndicator=false&showHeader=false&showEval=false&showRoads=false&stackCounts=false&notifyGame=false';

const NinjaMessageSchema = z.object({
  action: z.string(),
  value: z.any(),
});

@Component({
  selector: 'app-board-ninja-component',
  imports: [],
  templateUrl: './board-ninja-component.html',
  styleUrl: './board-ninja-component.css',
})
export class BoardNinjaComponent {
  game = input.required<TakGameUI>();
  action = output<TakActionEvent>();
  mode = input.required<GameMode>();

  sanitizer = inject(DomSanitizer);
  ninjaUrl = computed<SafeResourceUrl>(() => {
    const mode = this.mode();
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://ptn.ninja/${params}${mode.type === 'spectator' ? '&disableBoard=true' : ''}`,
    );
  });

  hasLoaded = signal(false);

  iframe = viewChild.required<ElementRef<HTMLIFrameElement>>('frame');

  sendMessageToIframe(message: unknown) {
    this.iframe().nativeElement.contentWindow?.postMessage(message, '*');
  }

  private readonly _sendUiSettingsEffect = effect(() => {
    if (!this.hasLoaded()) return;
    console.log('Sending UI settings to Board Ninja iframe.');
    this.sendMessageToIframe({
      action: 'SET_UI',
      value: {
        theme: 'discord',
        axisLabels: true,
        axisLabelsSmall: false,
        highlightSquares: true,
        animateBoard: true,
        board3D: false,
        orthographic: false,
        perspective: false,
      },
    });
  });

  private history = computed(() => this.game().actualGame.history);
  private settings = computed(() => this.game().actualGame.settings);
  private gameState = computed(() => this.game().actualGame.gameState);

  private readonly _syncGameStateEffect = effect(() => {
    if (!this.hasLoaded()) return;

    const history = this.history();
    const settings = this.settings();
    const gameState = this.gameState();

    const ptn = gameToPTN(settings, history, gameState);
    this.sendMessageToIframe({
      action: 'SET_CURRENT_PTN',
      value: ptn,
    });
    return;
  });

  private readonly _historyNavigationEffect = effect(() => {
    if (!this.hasLoaded()) return;
    const game = this.game();
    const mode = this.mode();
    if (game.plyIndex === null) {
      this.sendMessageToIframe({
        action: 'LAST',
        value: null,
      });
    } else {
      if (game.plyIndex === 0) {
        this.sendMessageToIframe({
          action: 'FIRST',
          value: null,
        });
      } else {
        this.sendMessageToIframe({
          action: 'GO_TO_PLY',
          value: {
            plyID: game.plyIndex - 1,
            isDone: true,
          },
        });
      }
    }
    this.sendMessageToIframe({
      action: 'SET_UI',
      value: {
        disableBoard: !(
          game.plyIndex === null &&
          mode.type !== 'spectator' &&
          game.actualGame.gameState.type === 'ongoing'
        ),
      },
    });
  });

  private readonly _sendPlayerSettingsEffect = effect(() => {
    if (!this.hasLoaded()) return;
    const mode = this.mode();
    if (mode.type !== 'online') return;
    this.sendMessageToIframe({
      action: 'SET_PLAYER',
      value: mode.localPlayer === 'white' ? 1 : 2,
    });
  });

  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent) {
    if (event.origin !== 'https://ptn.ninja') return;
    const parsed = NinjaMessageSchema.safeParse(event.data);
    if (!parsed.success) return;
    const message = parsed.data;
    const hasLoaded = this.hasLoaded();
    if (message.action === 'GAME_STATE' && !hasLoaded) {
      this.hasLoaded.set(true);
    } else if (hasLoaded && message.action === 'INSERT_PLY') {
      this.action.emit({ type: 'full', action: moveFromString(message.value as string) });
    }
  }
}
