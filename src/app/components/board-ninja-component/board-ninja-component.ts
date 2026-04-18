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
import { GameMode } from '../game-component/game-component';
import { actionFromString, gameToPTN } from '../../../tak-core/ptn';
import { SettingsService } from '../../services/settings-service/settings-service';
import { TakAction, TakBaseGame } from '../../../tak-core';

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
  game = input.required<TakBaseGame>();
  plyIndex = input.required<number | null>();
  action = output<TakAction>();
  mode = input.required<GameMode>();

  settingsService = inject(SettingsService);

  sanitizer = inject(DomSanitizer);
  ninjaUrl = computed<SafeResourceUrl>(() => {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://ptn.ninja/${params}`);
  });

  hasLoaded = signal(false);

  iframe = viewChild.required<ElementRef<HTMLIFrameElement>>('frame');

  sendMessageToIframe(message: unknown) {
    this.iframe().nativeElement.contentWindow?.postMessage(message, '*');
  }

  private shouldBoardBeDisabled = computed(() => {
    const mode = this.mode();
    const game = this.game();
    return (
      mode.type === 'spectator' ||
      this.plyIndex() !== null ||
      !game.isOngoing() ||
      (mode.type === 'online' && mode.localPlayer !== game.currentPlayer)
    );
  });

  private readonly _sendDisableBoardEffect = effect(() => {
    if (!this.hasLoaded()) return;
    const disableBoard = this.shouldBoardBeDisabled();
    console.log('Sending disableBoard =', disableBoard, 'to Board Ninja iframe.');
    this.sendMessageToIframe({
      action: 'SET_UI',
      value: {
        disableBoard,
      },
    });
  });

  private readonly _sendUiSettingsEffect = effect(() => {
    if (!this.hasLoaded()) return;
    const settings = this.settingsService.boardNinjaSettings();
    console.log('Sending UI settings to Board Ninja iframe.');
    this.sendMessageToIframe({
      action: 'SET_UI',
      value: {
        theme: settings.colorTheme,
        axisLabels: settings.axisLabels !== 'none',
        axisLabelsSmall: settings.axisLabels === 'small',
        highlightSquares: settings.highlightSquares,
        animateBoard: settings.animateBoard,
        board3D: settings.board3d,
        orthographic: settings.orthographic,
        perspective: settings.perspective,
      },
    });
  });

  private history = computed(() => this.game().actionHistory);
  private settings = computed(() => this.game().settings);
  private gameResult = computed(() => this.game().gameResult);

  private readonly _syncGameStateEffect = effect(() => {
    if (!this.hasLoaded()) return;

    const history = this.history();
    const settings = this.settings();
    const gameResult = this.gameResult();

    const ptn = gameToPTN(settings, history, gameResult);
    this.sendMessageToIframe({
      action: 'SET_CURRENT_PTN',
      value: ptn,
    });
    return;
  });

  private readonly _historyNavigationEffect = effect(() => {
    if (!this.hasLoaded()) return;
    const plyIndex = this.plyIndex();
    if (plyIndex === null) {
      this.sendMessageToIframe({
        action: 'LAST',
        value: null,
      });
    } else {
      if (plyIndex === 0) {
        this.sendMessageToIframe({
          action: 'FIRST',
          value: null,
        });
      } else {
        this.sendMessageToIframe({
          action: 'GO_TO_PLY',
          value: {
            plyID: plyIndex - 1,
            isDone: true,
          },
        });
      }
    }
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
      const action = actionFromString(message.value as string);
      if (!action) {
        console.warn('Received invalid action from Board Ninja iframe:', message.value);
        return;
      }
      this.action.emit(action);
    }
  }
}
