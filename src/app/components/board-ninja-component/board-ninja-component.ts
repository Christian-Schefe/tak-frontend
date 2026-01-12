import {
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import z from 'zod';

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
  sanitizer = inject(DomSanitizer);
  ninjaUrl = computed<SafeResourceUrl>(() => {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://ptn.ninja/${params}`);
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
  }

  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent) {
    if (event.origin !== 'https://ptn.ninja') return;
    const parsed = NinjaMessageSchema.safeParse(event.data);
    if (!parsed.success) return;
    const message = parsed.data;
    if (message.action === 'GAME_STATE') {
      this.hasLoaded.set(true);
      console.log('Board Ninja game state loaded.');
    }
  }
}
