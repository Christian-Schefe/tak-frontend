import { Component, computed, inject, linkedSignal, signal, AfterViewInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { IdentityService } from '../../services/identity-service/identity-service';
import { RippleModule } from 'primeng/ripple';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideEye,
  lucideMenu,
  lucidePlay,
  lucideSettings,
  lucideSwords,
  lucideUser,
} from '@ng-icons/lucide';
import { PlayerService } from '../../services/player-service/player-service';
import { SeeksDialogComponent } from '../seeks-dialog-component/seeks-dialog-component';
import { GamesDialogComponent } from '../games-dialog-component/games-dialog-component';
import { NewGameDialog } from '../new-game-dialog/new-game-dialog';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { NgTemplateOutlet } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { filter } from 'rxjs';

type MenuItem =
  | {
      type: 'button';
      label: string;
      icon: string;
      command: () => void;
    }
  | {
      type: 'link';
      label: string;
      icon: string;
      routerLink: string;
    };

@Component({
  selector: 'app-app-nav-component',
  imports: [
    RouterLink,
    NgIcon,
    RippleModule,
    SeeksDialogComponent,
    GamesDialogComponent,
    NewGameDialog,
    ButtonModule,
    DrawerModule,
    NgTemplateOutlet,
  ],
  templateUrl: './app-nav-component.html',
  styleUrl: './app-nav-component.css',
  viewProviders: [
    provideIcons({
      lucideSettings,
      lucideUser,
      lucidePlay,
      lucideSwords,
      lucideEye,
      lucideMenu,
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

  seeksDialogVisible = signal(false);
  gamesDialogVisible = signal(false);
  newGameDialogVisible = signal(false);

  items = computed<MenuItem[]>(() => {
    const identity = this.identityService.identity();
    return [
      {
        type: 'button',
        label: 'New Game',
        icon: 'lucidePlay',
        command: () => {
          this.newGameDialogVisible.set(true);
          this.visible.set(false);
        },
      },
      {
        type: 'button',
        label: 'Seeks',
        icon: 'lucideSwords',
        command: () => {
          this.seeksDialogVisible.set(true);
          this.visible.set(false);
        },
      },
      {
        type: 'button',
        label: 'Games',
        icon: 'lucideEye',
        command: () => {
          this.gamesDialogVisible.set(true);
          this.visible.set(false);
        },
      },
      {
        type: 'link',
        label: 'Settings',
        icon: 'lucideSettings',
        routerLink: '/settings',
      },
      {
        type: 'link',
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
