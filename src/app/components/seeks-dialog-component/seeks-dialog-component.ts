import { Component, computed, inject, model } from '@angular/core';
import { SeekInfo, SeekService } from '../../services/seek-service/seek-service';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { PlayerInfo, PlayerService } from '../../services/player-service/player-service';
import { HttpResourceRef } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-seeks-dialog-component',
  imports: [TableModule, DialogModule, ButtonModule],
  templateUrl: './seeks-dialog-component.html',
  styleUrl: './seeks-dialog-component.css',
})
export class SeeksDialogComponent {
  seekService = inject(SeekService);
  playerService = inject(PlayerService);
  visible = model(false);

  trackBy(seek: { id: string }) {
    return seek.id;
  }

  asSeek(seek: unknown): SeekInfo {
    return seek as SeekInfo;
  }

  playerInfos = computed(() => {
    const players = this.seekService
      .seeks()
      .flatMap((seek) => [seek.creatorId, seek.opponentId])
      .filter((id): id is string => !!id);
    const map: Record<string, HttpResourceRef<PlayerInfo | undefined>> = {};
    for (const playerId of players) {
      const resource = this.playerService.getPlayerInfo(playerId);
      map[playerId] = resource;
    }
    return map;
  });

  onAcceptSeek(seekId: number) {
    this.seekService.acceptSeek(seekId).subscribe(() => {
      console.log('Seek accepted:', seekId);
    });
  }
}
