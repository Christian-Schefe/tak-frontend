import { Component, computed, inject, input, signal } from '@angular/core';
import { IdentityService } from '../../services/identity-service/identity-service';
import { PlayerService } from '../../services/player-service/player-service';
import { CardModule } from 'primeng/card';
import { RoundPipe } from '../../util/round-pipe/round-pipe';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEdit, lucideEye, lucideSwords, lucideTrophy } from '@ng-icons/lucide';
import { MeterGroupModule, MeterItem } from 'primeng/metergroup';
import * as flags from 'country-flag-icons/string/3x2';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  AccountProfileUpdate,
  ProfileService,
} from '../../services/profile-service/profile-service';
import { ButtonModule } from 'primeng/button';
import { EditPlayerProfileDialog } from '../../components/edit-player-profile-dialog/edit-player-profile-dialog';
import { GameHistoryService } from '../../services/game-history-service/game-history-service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Router } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { PlayerLabel } from '../../components/player-label/player-label';
import { DatePipe } from '@angular/common';
import { ProfilePictureChangeDialog } from '../../components/profile-picture-change-dialog/profile-picture-change-dialog';

const flagsMap = new Map<string, string>(Object.entries(flags));

@Component({
  selector: 'app-player-profile-route',
  imports: [
    CardModule,
    RoundPipe,
    NgIcon,
    MeterGroupModule,
    ButtonModule,
    EditPlayerProfileDialog,
    ProgressSpinnerModule,
    RippleModule,
    PlayerLabel,
    DatePipe,
    ProfilePictureChangeDialog,
  ],
  templateUrl: './player-profile-route.html',
  styleUrl: './player-profile-route.css',
  viewProviders: [provideIcons({ lucideTrophy, lucideSwords, lucideEdit, lucideEye })],
})
export class PlayerProfileRoute {
  private identityService = inject(IdentityService);
  private playerService = inject(PlayerService);
  private profileService = inject(ProfileService);
  private gameHistoryService = inject(GameHistoryService);
  private router = inject(Router);
  id = input.required<string>();

  playerInfoRef = this.playerService.getComputedPlayerInfo(() => this.id());
  playerInfo = computed(() => {
    const ref = this.playerInfoRef();
    if (ref && ref.hasValue()) {
      return ref.value();
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
  playerProfile = this.profileService.getProfile(() => this.playerInfo()?.accountId);
  playerGameHistory = this.gameHistoryService.playerGameHistory(() => {
    const id = this.id();
    return { playerId: id, page: 1, pageSize: 20 };
  });

  canEditProfile = computed(() => {
    const identity = this.identityService.identity();
    return identity !== null && identity.playerId === this.id() && !identity.isGuest;
  });

  profilePictureUrl = computed(() => {
    const id = this.playerInfo()?.accountId;
    const version = this.playerProfile.value()?.profilePictureVersion;
    if (id === undefined || version === undefined) {
      return null;
    }
    return this.profileService.getProfilePictureUrl(id, version);
  });

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
    const safeSum = sum === 0 ? 1 : sum;
    const winPercent = Math.round((stats.gamesWon * 100) / safeSum);
    const lossPercent = Math.round((stats.gamesLost * 100) / safeSum);
    const drawPercent = sum === 0 ? 0 : 100 - winPercent - lossPercent;
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
  profilePictureDialogVisible = signal(false);

  onUpdateProfile(profile: AccountProfileUpdate) {
    console.log('Updating profile', profile);
    this.profileService.updateProfile(profile).subscribe(() => {
      console.log('Profile updated successfully');
      this.playerProfile.refetch();
    });
  }

  onViewGame(gameId: number) {
    void this.router.navigate(['/online', gameId.toString()]);
  }

  onClickProfilePicture() {
    if (this.canEditProfile()) {
      this.profilePictureDialogVisible.set(true);
    }
  }

  onUploadAvatar(file: File) {
    console.log('Uploading avatar', file);
    this.profileService.uploadProfilePicture(file).subscribe(() => {
      console.log('Avatar uploaded successfully');
      this.profilePictureDialogVisible.set(false);
      this.playerProfile.refetch();
    });
  }
}
