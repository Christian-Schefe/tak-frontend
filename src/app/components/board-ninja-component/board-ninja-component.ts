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
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import z from 'zod';
import { GameMode } from '../game-component/game-component';
import { TakGameUI } from '../../../tak-core/ui';
import { moveFromString, moveRecordToString } from '../../../tak-core/move';
import { TakGameSettings, TakAction } from '../../../tak-core';

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
  settings = input.required<TakGameSettings>();
  game = input.required<TakGameUI>();
  action = output<TakAction>();
  mode = input.required<GameMode>();
  plyIndex = signal(0);

  sanitizer = inject(DomSanitizer);
  ninjaUrl = computed<SafeResourceUrl>(() => {
    const mode = this.mode();
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://ptn.ninja/${params}${mode.type === 'spectator' ? '&disableBoard=true' : ''}`,
    );
  });

  hasLoaded = signal(false);

  @ViewChild('frame') iframe: ElementRef<HTMLIFrameElement> | undefined;

  sendMessageToIframe(message: unknown) {
    this.iframe?.nativeElement.contentWindow?.postMessage(message, '*');
  }

  constructor() {
    effect(() => {
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

    effect(() => {
      if (!this.hasLoaded()) return;
      const plyIndex = this.plyIndex();
      const gameSettings = this.settings();
      const game = this.game();
      if (plyIndex === 0) {
        this.sendMessageToIframe({
          action: 'SET_CURRENT_PTN',
          value: `[Size "${gameSettings.boardSize.toString()}"][Komi "${(gameSettings.halfKomi / 2).toString()}"][Flats "${gameSettings.reserve.pieces.toString()}"][Caps "${gameSettings.reserve.capstones.toString()}"]`,
        });
      }
      if (plyIndex < game.actualGame.history.length) {
        for (let i = plyIndex; i < game.actualGame.history.length; i++) {
          console.log('sending move to ninja:', moveRecordToString(game.actualGame.history[i]));
          this.sendMessageToIframe({
            action: 'APPEND_PLY',
            value: moveRecordToString(game.actualGame.history[i]),
          });
        }
        this.plyIndex.set(game.actualGame.history.length);
      }
      if (plyIndex > game.actualGame.history.length) {
        this.plyIndex.set(0);
      }
    });

    effect(() => {
      if (!this.hasLoaded()) return;
      const mode = this.mode();
      if (mode.type !== 'online') return;
      this.sendMessageToIframe({
        action: 'SET_PLAYER',
        value: mode.localColor === 'white' ? 1 : 2,
      });
    });

    effect(() => {
      if (!this.hasLoaded()) return;
      const game = this.game();
      this.sendMessageToIframe({
        action: 'SET_UI',
        value: {
          disableBoard: !(
            this.mode().type !== 'spectator' && game.actualGame.gameState.type === 'ongoing'
          ),
        },
      });
    });
  }

  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent) {
    if (event.origin !== 'https://ptn.ninja') return;
    const parsed = NinjaMessageSchema.safeParse(event.data);
    if (!parsed.success) return;
    const message = parsed.data;
    if (message.action === 'GAME_STATE' && !this.hasLoaded()) {
      this.hasLoaded.set(true);
    } else if (parsed.data.action === 'INSERT_PLY') {
      this.plyIndex.update((index) => index + 1);
      this.action.emit(moveFromString(parsed.data.value as string));
    }
  }
}
