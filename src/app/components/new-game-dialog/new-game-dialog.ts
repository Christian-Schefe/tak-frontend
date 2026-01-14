import { Component, inject, model } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { TabsModule } from 'primeng/tabs';
import { NewSeekForm } from '../new-seek-form/new-seek-form';
import { CreateSeekPayload, SeekService } from '../../services/seek-service/seek-service';

@Component({
  selector: 'app-new-game-dialog',
  imports: [DialogModule, TabsModule, NewSeekForm],
  templateUrl: './new-game-dialog.html',
  styleUrl: './new-game-dialog.css',
})
export class NewGameDialog {
  visible = model.required<boolean>();
  seekService = inject(SeekService);

  onCreateSeek(payload: CreateSeekPayload) {
    this.seekService.createSeek(payload).subscribe(() => {
      console.log('Seek created');
    });
  }
}
