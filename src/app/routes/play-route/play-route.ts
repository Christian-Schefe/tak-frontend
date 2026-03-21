import { Component, computed, inject, signal } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { GameService } from '../../services/game-service/game-service';
import { CardModule } from 'primeng/card';
import { IdentityService } from '../../services/identity-service/identity-service';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { SeeksTableComponent } from '../../components/seeks-table-component/seeks-table-component';
import { CreateSeekPayload, SeekService } from '../../services/seek-service/seek-service';
import { TakGameSettings } from '../../../tak-core';
import { NewSeekForm } from '../../components/new-seek-form/new-seek-form';
import { NewLocalForm } from '../../components/new-local-form/new-local-form';

@Component({
  selector: 'app-games-route',
  imports: [
    TabsModule,
    CardModule,
    RouterLink,
    ButtonModule,
    RippleModule,
    SeeksTableComponent,
    NewSeekForm,
    NewLocalForm,
  ],
  templateUrl: './play-route.html',
  styleUrl: './play-route.css',
})
export class PlayRoute {
  private gameService = inject(GameService);
  private identityService = inject(IdentityService);
  private router = inject(Router);
  private seekService = inject(SeekService);

  seeks = this.seekService.seeks;

  activeTab = signal('0');

  onCreateSeek(payload: CreateSeekPayload) {
    this.seekService.createSeek(payload).subscribe(() => {
      console.log('Seek created');
      this.activeTab.set('0');
    });
  }

  onPlayLocal(payload: TakGameSettings) {
    this.gameService.startNewLocalGame(payload);
    void this.router.navigate(['/local']);
  }

  thisPlayerGames = computed(() => {
    const identity = this.identityService.identity();
    if (!identity) {
      return [];
    }
    const games = this.gameService.games();
    return games.filter(
      (game) =>
        game.playerIds.white === identity.playerId || game.playerIds.black === identity.playerId,
    );
  });

  onViewGame(gameId: number) {
    void this.router.navigate(['/online', gameId.toString()]);
  }

  onAcceptSeek(seekId: number) {
    this.seekService.acceptSeek(seekId).subscribe(() => {
      console.log('Seek accepted:', seekId);
    });
  }

  onCancelSeek(seekId: number) {
    this.seekService.cancelSeek(seekId).subscribe(() => {
      console.log('Seek canceled:', seekId);
    });
  }
}
