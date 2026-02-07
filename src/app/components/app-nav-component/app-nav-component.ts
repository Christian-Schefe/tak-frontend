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

interface MenuItem {
  label: string;
  icon: string;
  routerLink: string;
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
  private router = inject(Router);

  playerInfo = this.playerService.getComputedPlayerInfo(
    () => this.identityService.identity()?.playerId,
  );

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
        label: 'Profile',
        icon: 'lucideUser',
        routerLink: `/player/${identity?.playerId ?? ''}`,
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
