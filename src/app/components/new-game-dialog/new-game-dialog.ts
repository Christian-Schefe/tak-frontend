import { Component, inject, model } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { TabsModule } from 'primeng/tabs';
import { NewSeekForm } from '../new-seek-form/new-seek-form';
import { CreateSeekPayload, SeekService } from '../../services/seek-service/seek-service';
import { Router } from '@angular/router';
import { GameService } from '../../services/game-service/game-service';
import { TakGameSettings } from '../../../tak-core';
import { NewLocalForm } from '../new-local-form/new-local-form';

@Component({
  selector: 'app-new-game-dialog',
  imports: [DialogModule, TabsModule, NewSeekForm, NewLocalForm],
  templateUrl: './new-game-dialog.html',
  styleUrl: './new-game-dialog.css',
})
export class NewGameDialog {
  visible = model.required<boolean>();
  seekService = inject(SeekService);
  router = inject(Router);
  gameService = inject(GameService);

  onCreateSeek(payload: CreateSeekPayload) {
    this.seekService.createSeek(payload).subscribe(() => {
      console.log('Seek created');
    });
    this.visible.set(false);
  }

  onPlayLocal(payload: TakGameSettings) {
    this.gameService.startNewLocalGame(payload);
    this.visible.set(false);
    void this.router.navigate(['/app/local']);
  }
}
