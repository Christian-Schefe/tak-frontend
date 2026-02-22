import { Component, computed, inject, input } from '@angular/core';
import { PlayerService } from '../../services/player-service/player-service';
import { RoundPipe } from '../../util/round-pipe/round-pipe';
import { GamePlayer } from '../game-component/game-component';
import { ProfileService } from '../../services/profile-service/profile-service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as flags from 'country-flag-icons/string/3x2';

const flagsMap = new Map<string, string>(Object.entries(flags));

@Component({
  selector: 'app-game-player-label',
  imports: [RoundPipe],
  templateUrl: './game-player-label.html',
  styleUrl: './game-player-label.css',
})
export class GamePlayerLabel {
  gamePlayer = input.required<GamePlayer>();
  playerService = inject(PlayerService);
  profileService = inject(ProfileService);

  playerInfoRef = this.playerService.getComputedPlayerInfo(() => {
    const player = this.gamePlayer();
    if (player.type === 'player') {
      return player.playerId;
    }
    return undefined;
  });

  playerInfo = computed(() => {
    const ref = this.playerInfoRef();
    if (ref && ref.hasValue()) {
      return ref.value();
    }
    return null;
  });

  displayName = computed(() => {
    const player = this.gamePlayer();
    if (player.type === 'local') {
      return player.name;
    } else {
      return this.playerInfo()?.displayName ?? null;
    }
  });

  rating = computed(() => {
    const player = this.gamePlayer();
    if (player.type === 'local') {
      return null;
    } else {
      const rating = this.playerInfo()?.rating?.rating;
      return rating !== undefined ? Math.round(rating) : null;
    }
  });

  playerProfile = this.profileService.getProfile(() => {
    const player = this.playerInfo();
    return player?.accountId;
  });

  imageSrc = computed(() => {
    const player = this.playerInfo();
    if (!player) {
      return '/fallback/default_user.webp';
    }
    const val = this.playerProfile.value();
    if (!val) {
      return null;
    }
    return this.profileService.getProfilePictureUrl(player.accountId, val.profilePictureVersion);
  });

  private sanitizer = inject(DomSanitizer);

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
}
