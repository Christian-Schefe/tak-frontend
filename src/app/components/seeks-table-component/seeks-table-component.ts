import { Component, inject, input, output } from '@angular/core';
import { SeekInfo } from '../../services/seek-service/seek-service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { PlayerLabel } from '../player-label/player-label';
import { TimeControlPipe } from '../../util/time-control-pipe/time-control-pipe';
import { RippleModule } from 'primeng/ripple';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSwords, lucideTrash } from '@ng-icons/lucide';
import { IdentityService } from '../../services/identity-service/identity-service';

@Component({
  selector: 'app-seeks-table-component',
  imports: [TableModule, ButtonModule, PlayerLabel, TimeControlPipe, RippleModule, NgIcon],
  templateUrl: './seeks-table-component.html',
  styleUrl: './seeks-table-component.css',
  viewProviders: [provideIcons({ lucideSwords, lucideTrash })],
})
export class SeeksTableComponent {
  identityService = inject(IdentityService);
  seeks = input.required<SeekInfo[]>();
  acceptSeek = output<number>();
  cancelSeek = output<number>();

  trackBy(seek: { id: string }) {
    return seek.id;
  }

  asSeek(seek: unknown): SeekInfo {
    return seek as SeekInfo;
  }
}
