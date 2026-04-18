import { Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFlag, lucideHandshake, lucideInfo, lucideUndo } from '@ng-icons/lucide';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { TakBaseGame } from '../../../tak-core/base';

@Component({
  selector: 'app-game-actions-panel',
  imports: [ButtonModule, NgIcon, ConfirmPopupModule, DialogModule],
  templateUrl: './game-actions-panel.html',
  styleUrl: './game-actions-panel.css',
  viewProviders: [provideIcons({ lucideFlag, lucideHandshake, lucideUndo, lucideInfo })],
  providers: [ConfirmationService],
})
export class GameActionsPanel {
  requestDraw = output();
  requestUndo = output();
  retractRequest = output<number>();
  rematchRequestAction = input<'request' | 'accept' | 'retract'>();
  requestRematch = output();
  retractRematchRequest = output();
  game = input.required<TakBaseGame>();
  resign = output();
  gameState = computed(() => this.game().gameState());
  private confirmationService = inject(ConfirmationService);

  drawOffer = input.required<number | null>();
  undoRequest = input.required<number | null>();

  canUndo = computed(() => {
    const game = this.game();
    return game.canUndoAction();
  });
  hasUndoRequest = computed(() => {
    return this.undoRequest() !== null;
  });

  hasDrawOffer = computed(() => {
    return this.drawOffer() !== null;
  });

  onClickUndo(event: Event) {
    const requestId = this.undoRequest();
    if (requestId !== null) {
      this.retractRequest.emit(requestId);
    } else {
      this.confirmAction(
        'Are you sure you want to request an undo?',
        () => {
          this.requestUndo.emit();
        },
        event,
      );
    }
  }

  onClickDraw(event: Event) {
    const requestId = this.drawOffer();
    if (requestId !== null) {
      this.retractRequest.emit(requestId);
    } else {
      this.confirmAction(
        'Are you sure you want to offer a draw?',
        () => {
          this.requestDraw.emit();
        },
        event,
      );
    }
  }

  onClickResign(event: Event) {
    this.confirmAction(
      'Are you sure you want to resign?',
      () => {
        this.resign.emit();
      },
      event,
    );
  }

  onClickRematchAction() {
    const action = this.rematchRequestAction();
    console.log('Rematch action:', action);
    if (action === 'request') {
      this.requestRematch.emit();
    } else if (action === 'accept') {
      this.requestRematch.emit();
    } else if (action === 'retract') {
      this.retractRematchRequest.emit();
    }
  }

  showGameOverInfo = linkedSignal(() => {
    return this.gameState().type !== 'ongoing';
  });

  private confirmAction(message: string, accept: () => void, event: Event) {
    this.confirmationService.close();
    const target = event.currentTarget as EventTarget;
    setTimeout(() => {
      this.confirmationService.confirm({
        target,
        message,
        acceptLabel: 'Confirm',
        rejectLabel: 'Cancel',
        rejectButtonProps: {
          severity: 'secondary',
          outlined: true,
        },
        acceptButtonProps: {
          severity: 'danger',
        },
        accept,
      });
    });
  }
}
