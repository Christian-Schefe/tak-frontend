import { Component, computed, inject, input, signal } from '@angular/core';
import { IdentityService } from '../../services/identity-service/identity-service';
import { PlayerService } from '../../services/player-service/player-service';
import { CardModule } from 'primeng/card';
import { RoundPipe } from '../../util/round-pipe/round-pipe';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideEdit,
  lucideEye,
  lucideFlame,
  lucideHash,
  lucideSwords,
  lucideTrophy,
} from '@ng-icons/lucide';
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
import { MessageService } from 'primeng/api';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ChartModule } from 'primeng/chart';
import { endOfDay, startOfDay, subDays, subYears } from 'date-fns';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

const flagsMap = new Map<string, string>(Object.entries(flags));

type RatingRangeOptionKey =
  | 'last-7-days'
  | 'last-30-days'
  | 'last-90-days'
  | 'last-year'
  | 'all-time';

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
    ScrollPanelModule,
    ChartModule,
    SelectModule,
    FormsModule,
  ],
  templateUrl: './player-profile-route.html',
  styleUrl: './player-profile-route.css',
  viewProviders: [
    provideIcons({ lucideTrophy, lucideSwords, lucideEdit, lucideEye, lucideHash, lucideFlame }),
  ],
})
export class PlayerProfileRoute {
  private identityService = inject(IdentityService);
  private playerService = inject(PlayerService);
  private profileService = inject(ProfileService);
  private gameHistoryService = inject(GameHistoryService);
  private messageService = inject(MessageService);
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
  playerStats = this.playerStatsRef.value;
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
    const profile = this.playerProfile.value();
    if (id === undefined || profile === undefined) {
      return null;
    }
    if (profile.profilePictureVersion === null) {
      return '/fallback/default_user.webp';
    }
    return this.profileService.getProfilePictureUrl(id, profile.profilePictureVersion);
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
  ratingRangeOptionsMap = computed(() => {
    const now = new Date();
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);
    const options: Record<RatingRangeOptionKey, { from: Date | null; to: Date }> = {
      'last-7-days': { from: subDays(startOfToday, 6), to: endOfToday },
      'last-30-days': { from: subDays(startOfToday, 29), to: endOfToday },
      'last-90-days': { from: subDays(startOfToday, 89), to: endOfToday },
      'last-year': { from: subYears(startOfToday, 1), to: endOfToday },
      'all-time': { from: null, to: endOfToday },
    };
    return options;
  });

  ratingRangeOptions: { label: string; value: RatingRangeOptionKey }[] = [
    { label: 'Last 7 days', value: 'last-7-days' },
    { label: 'Last 30 days', value: 'last-30-days' },
    { label: 'Last 90 days', value: 'last-90-days' },
    { label: 'Last year', value: 'last-year' },
    { label: 'All time', value: 'all-time' },
  ];

  ratingRange = signal<RatingRangeOptionKey>('last-30-days');
  ratingHistoryData = this.playerService.getRatingHistory(() => {
    const id = this.id();
    const range = this.ratingRange();
    const rangeOptions = this.ratingRangeOptionsMap();
    const selectedRange = rangeOptions[range];
    return {
      playerId: id,
      from: selectedRange.from,
      to: selectedRange.to,
    };
  });

  ratingHistory = computed(() => {
    const data = this.ratingHistoryData.value();
    const entries = data ? data.entries : [];
    if (data?.firstEntryBeforeRange) {
      entries.push(data.firstEntryBeforeRange);
    }
    if (entries.length > 0) {
      const lastRating = entries[0].rating;
      entries.unshift({
        timestamp: Date.now(),
        rating: lastRating,
      });
    }
    const chartData = entries
      .map((entry) => ({
        x: new Date(entry.timestamp),
        y: Math.round(entry.rating),
      }))
      .reverse();
    const documentStyle = getComputedStyle(document.documentElement);
    const primaryColor = documentStyle.getPropertyValue('--p-primary-500');

    const range = this.ratingRange();
    const rangeOptions = this.ratingRangeOptionsMap();
    const selectedRange = rangeOptions[range];
    const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
    const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

    const yMin = chartData.length > 0 ? Math.min(...chartData.map((d) => d.y)) : undefined;
    const yMax = chartData.length > 0 ? Math.max(...chartData.map((d) => d.y)) : undefined;

    const nearestSmallerHundred = (num: number) => Math.floor(num / 100) * 100;
    const nearestLargerHundred = (num: number) => Math.ceil(num / 100) * 100;

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time',
          time: {},
          min: selectedRange.from ? selectedRange.from.getTime() : undefined,
          max: selectedRange.to,
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
          },
        },
        y: {
          beginAtZero: false,
          min: yMin !== undefined ? nearestSmallerHundred(yMin - 10) : undefined,
          max: yMax !== undefined ? nearestLargerHundred(yMax + 10) : undefined,
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
      interaction: {
        mode: 'nearest',
        intersect: false,
      },
    };
    return {
      options,
      data: {
        datasets: [
          {
            borderColor: primaryColor,
            data: chartData,
            stepped: true,
          },
        ],
      },
    };
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
    this.profilePictureDialogVisible.set(false);
    this.messageService.add({
      severity: 'info',
      summary: 'Uploading avatar...',
      detail: 'Your new profile picture is being uploaded.',
    });
    this.profileService.uploadProfilePicture(file).subscribe(() => {
      console.log('Avatar uploaded successfully');
      this.playerProfile.refetch();
      this.messageService.add({
        severity: 'success',
        summary: 'Avatar uploaded',
        detail: 'Your profile picture has been updated.',
      });
    });
  }
}
