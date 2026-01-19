import { Component, computed, inject, input } from '@angular/core';
import { IdentityService } from '../../services/identity-service/identity-service';
import { PlayerService } from '../../services/player-service/player-service';
import { CardModule } from 'primeng/card';
import { RoundPipe } from '../../util/round-pipe/round-pipe';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSwords, lucideTrophy } from '@ng-icons/lucide';
import { MeterGroupModule, MeterItem } from 'primeng/metergroup';
import * as flags from 'country-flag-icons/string/3x2';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-player-profile-route',
  imports: [CardModule, RoundPipe, NgIcon, MeterGroupModule],
  templateUrl: './player-profile-route.html',
  styleUrl: './player-profile-route.css',
  viewProviders: [provideIcons({ lucideTrophy, lucideSwords })],
})
export class PlayerProfileRoute {
  identityService = inject(IdentityService);
  playerService = inject(PlayerService);
  id = input.required<string>();
  playerInfoRef = this.playerService.getPlayerInfoRef(() => this.id());
  playerInfo = computed(() => {
    if (this.playerInfoRef.hasValue()) {
      return this.playerInfoRef.value();
    }
    return null;
  });
  playerStatsRef = this.playerService.getPlayerStatsRef(() => this.id());
  playerStats = computed(() => {
    if (this.playerStatsRef.hasValue()) {
      return this.playerStatsRef.value();
    }
    return null;
  });

  sanitizer = inject(DomSanitizer);

  flagSvg = computed<SafeHtml>(() => {
    return this.sanitizer.bypassSecurityTrustHtml(flags.DE);
  });

  thickMeter = {
    meters: {
      size: '1rem',
    },
  };

  wdlItems = computed<MeterItem[]>(() => {
    const stats = this.playerStats();
    if (!stats) {
      return [];
    }
    const sum = stats.gamesWon + stats.gamesDrawn + stats.gamesLost;
    return [
      {
        label: `${stats.gamesWon} Win${stats.gamesWon !== 1 ? 's' : ''}`,
        value: (stats.gamesWon * 100) / sum,
        color: 'var(--p-green-500)',
      },
      {
        label: `${stats.gamesDrawn} Draw${stats.gamesDrawn !== 1 ? 's' : ''}`,
        value: (stats.gamesDrawn * 100) / sum,
        color: 'var(--p-neutral-400)',
      },
      {
        label: `${stats.gamesLost} Loss${stats.gamesLost !== 1 ? 'es' : ''}`,
        value: (stats.gamesLost * 100) / sum,
        color: 'var(--p-red-500)',
      },
    ];
  });
}
