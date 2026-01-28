import { Component, computed, inject, input, signal } from '@angular/core';
import { IdentityService } from '../../services/identity-service/identity-service';
import { PlayerService } from '../../services/player-service/player-service';
import { CardModule } from 'primeng/card';
import { RoundPipe } from '../../util/round-pipe/round-pipe';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEdit, lucideSwords, lucideTrophy } from '@ng-icons/lucide';
import { MeterGroupModule, MeterItem } from 'primeng/metergroup';
import * as flags from 'country-flag-icons/string/3x2';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AccountProfile, ProfileService } from '../../services/profile-service/profile-service';
import { ButtonModule } from 'primeng/button';
import { EditPlayerProfileDialog } from '../../components/edit-player-profile-dialog/edit-player-profile-dialog';

const flagsMap = new Map<string, string>(Object.entries(flags));

@Component({
  selector: 'app-player-profile-route',
  imports: [CardModule, RoundPipe, NgIcon, MeterGroupModule, ButtonModule, EditPlayerProfileDialog],
  templateUrl: './player-profile-route.html',
  styleUrl: './player-profile-route.css',
  viewProviders: [provideIcons({ lucideTrophy, lucideSwords, lucideEdit })],
})
export class PlayerProfileRoute {
  identityService = inject(IdentityService);
  playerService = inject(PlayerService);
  profileService = inject(ProfileService);
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
  playerProfile = this.profileService.getProfile(() => this.id());

  sanitizer = inject(DomSanitizer);

  flagSvg = computed<SafeHtml | null>(() => {
    const country = this.playerProfile.value()?.country;
    if (country === null || country === undefined) {
      return null;
    }
    const flagSVG = flagsMap.get(country.toUpperCase());
    if (flagSVG === undefined) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustHtml(flagSVG);
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
    const winPercent = Math.round((stats.gamesWon * 100) / sum);
    const lossPercent = Math.round((stats.gamesLost * 100) / sum);
    const drawPercent = 100 - winPercent - lossPercent;
    return [
      {
        label: `${stats.gamesWon.toString()} Win${stats.gamesWon !== 1 ? 's' : ''}`,
        value: winPercent,
        color: 'var(--p-green-500)',
      },
      {
        label: `${stats.gamesDrawn.toString()} Draw${stats.gamesDrawn !== 1 ? 's' : ''}`,
        value: drawPercent,
        color: 'var(--p-neutral-400)',
      },
      {
        label: `${stats.gamesLost.toString()} Loss${stats.gamesLost !== 1 ? 'es' : ''}`,
        value: lossPercent,
        color: 'var(--p-red-500)',
      },
    ];
  });

  editDialogVisible = signal(false);

  onUpdateProfile(profile: AccountProfile) {
    console.log('Updating profile', profile);
    this.playerProfile.resource.set(profile);
    this.profileService.updateProfile(this.id(), profile).subscribe(() => {
      console.log('Profile updated successfully');
    });
  }
}
