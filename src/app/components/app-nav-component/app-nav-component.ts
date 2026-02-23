import { Component, computed, inject, linkedSignal, AfterViewInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { IdentityService } from '../../services/identity-service/identity-service';
import { RippleModule } from 'primeng/ripple';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideGamepad,
  lucideMenu,
  lucidePlay,
  lucideSettings,
  lucideSwords,
  lucideUser,
} from '@ng-icons/lucide';
import { PlayerService } from '../../services/player-service/player-service';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { NgTemplateOutlet } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { filter } from 'rxjs';
import { ProfileService } from '../../services/profile-service/profile-service';

interface MenuItem {
  label: string;
  icon: string;
  routerLink: string;
  visible?: boolean;
}

@Component({
  selector: 'app-app-nav-component',
  imports: [RouterLink, NgIcon, RippleModule, ButtonModule, DrawerModule, NgTemplateOutlet],
  templateUrl: './app-nav-component.html',
  styleUrl: './app-nav-component.css',
  viewProviders: [
    provideIcons({
      lucideSettings,
      lucideUser,
      lucidePlay,
      lucideSwords,
      lucideMenu,
      lucideGamepad,
    }),
  ],
})
export class AppNavComponent implements AfterViewInit {
  identityService = inject(IdentityService);
  private playerService = inject(PlayerService);
  private profileService = inject(ProfileService);
  private router = inject(Router);

  playerInfo = this.playerService.getComputedPlayerInfo(
    () => this.identityService.identity()?.playerId,
  );

  playerProfile = this.profileService.getProfile(() => {
    const player = this.playerInfo()?.value();
    return player?.accountId;
  });

  avatarSrc = computed(() => {
    const player = this.playerInfo()?.value();
    if (!player) {
      return '/fallback/default_user.webp';
    }
    const val = this.playerProfile.value();
    if (!val) {
      return null;
    }
    if (val.profilePictureVersion === null) {
      return '/fallback/default_user.webp';
    }
    return this.profileService.getProfilePictureUrl(player.accountId, val.profilePictureVersion);
  });

  items = computed<MenuItem[]>(() => {
    const identity = this.identityService.identity();
    return [
      {
        label: 'New Game',
        icon: 'lucidePlay',
        routerLink: '/new',
      },
      {
        label: 'Games',
        icon: 'lucideGamepad',
        routerLink: '/games',
      },
      {
        label: 'Seeks',
        icon: 'lucideSwords',
        routerLink: '/seeks',
      },
      {
        label: 'Settings',
        icon: 'lucideSettings',
        routerLink: '/settings',
      },
      {
        label: 'Account',
        icon: 'lucideUser',
        visible: identity !== null,
        routerLink: '/account',
      },
    ];
  });

  visible = linkedSignal(() => {
    return false;
  });

  toggleVisible() {
    this.visible.update((v) => !v);
  }

  private breakpointObserver = inject(BreakpointObserver);

  ngAfterViewInit() {
    //The nav component is always present, so no need to unsubscribe from this
    this.breakpointObserver.observe('(min-width: 1024px)').subscribe((_) => {
      this.visible.set(false);
    });
    //The nav component is always present, so no need to unsubscribe from this
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.visible.set(false);
    });
  }
}
