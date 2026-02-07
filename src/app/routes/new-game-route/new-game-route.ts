import { Component, inject } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { NewSeekForm } from '../../components/new-seek-form/new-seek-form';
import { NewLocalForm } from '../../components/new-local-form/new-local-form';
import { CreateSeekPayload, SeekService } from '../../services/seek-service/seek-service';
import { Router } from '@angular/router';
import { GameService } from '../../services/game-service/game-service';
import { TakGameSettings } from '../../../tak-core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-new-game-route',
  imports: [TabsModule, NewSeekForm, NewLocalForm, CardModule],
  templateUrl: './new-game-route.html',
  styleUrl: './new-game-route.css',
})
export class NewGameRoute {
  private seekService = inject(SeekService);
  private router = inject(Router);
  private gameService = inject(GameService);

  onCreateSeek(payload: CreateSeekPayload) {
    this.seekService.createSeek(payload).subscribe(() => {
      console.log('Seek created');
    });
  }

  onPlayLocal(payload: TakGameSettings) {
    this.gameService.startNewLocalGame(payload);
    void this.router.navigate(['/local']);
  }
}
