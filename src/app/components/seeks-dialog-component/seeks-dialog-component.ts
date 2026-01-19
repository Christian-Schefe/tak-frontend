import { Component, inject, model } from '@angular/core';
import { SeekInfo, SeekService } from '../../services/seek-service/seek-service';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { PlayerService } from '../../services/player-service/player-service';
import { ButtonModule } from 'primeng/button';
import { PlayerLabel } from '../player-label/player-label';
import { TimeControlPipe } from '../../util/time-control-pipe/time-control-pipe';
import { Ripple } from 'primeng/ripple';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSwords, lucideTrash } from '@ng-icons/lucide';
import { IdentityService } from '../../services/identity-service/identity-service';

@Component({
  selector: 'app-seeks-dialog-component',
  imports: [TableModule, DialogModule, ButtonModule, PlayerLabel, TimeControlPipe, Ripple, NgIcon],
  templateUrl: './seeks-dialog-component.html',
  styleUrl: './seeks-dialog-component.css',
  viewProviders: [provideIcons({ lucideSwords, lucideTrash })],
})
export class SeeksDialogComponent {
  identityService = inject(IdentityService);
  seekService = inject(SeekService);
  playerService = inject(PlayerService);
  visible = model.required<boolean>();

  trackBy(seek: { id: string }) {
    return seek.id;
  }

  asSeek(seek: unknown): SeekInfo {
    return seek as SeekInfo;
  }

  playerInfos = this.playerService.getComputedPlayerInfos(() => {
    return this.seekService
      .seeks()
      .flatMap((seek) => [seek.creatorId, seek.opponentId])
      .filter((id): id is string => !!id);
  });

  onAcceptSeek(seekId: number) {
    this.seekService.acceptSeek(seekId).subscribe(() => {
      console.log('Seek accepted:', seekId);
    });
    this.visible.set(false);
  }

  onCancelSeek(seekId: number) {
    this.seekService.cancelSeek(seekId).subscribe(() => {
      console.log('Seek canceled:', seekId);
    });
  }
}
