import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IdentityService } from '../../services/identity-service/identity-service';
import { MenubarModule } from 'primeng/menubar';
import { RippleModule } from 'primeng/ripple';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideEye,
  lucideHome,
  lucideLogOut,
  lucidePlay,
  lucideSettings,
  lucideSwords,
  lucideUser,
} from '@ng-icons/lucide';
import { PlayerService } from '../../services/player-service/player-service';
import { MenuItem } from 'primeng/api';
import { SeeksDialogComponent } from '../seeks-dialog-component/seeks-dialog-component';
import { GamesDialogComponent } from '../games-dialog-component/games-dialog-component';
import { PlayerLabel } from '../player-label/player-label';
import { NewGameDialog } from '../new-game-dialog/new-game-dialog';
import { AuthService } from '../../services/auth-service/auth-service';

@Component({
  selector: 'app-app-nav-component',
  imports: [
    RouterLink,
    MenubarModule,
    NgIcon,
    RippleModule,
    SeeksDialogComponent,
    GamesDialogComponent,
    PlayerLabel,
    NewGameDialog,
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
      lucideHome,
      lucideLogOut,
    }),
  ],
})
export class AppNavComponent {
  identityService = inject(IdentityService);
  playerService = inject(PlayerService);
  authService = inject(AuthService);
  router = inject(Router);

  private playerInfoRef = this.playerService.getPlayerInfoRef(() => {
    const identity = this.identityService.identity();
    return identity?.playerId;
  });

  playerInfo = computed(() => {
    if (this.playerInfoRef.hasValue()) {
      return this.playerInfoRef.value();
    }
    return null;
  });

  seeksDialogVisible = signal(false);
  gamesDialogVisible = signal(false);
  newGameDialogVisible = signal(false);

  typedItem(item: unknown): MenuItem {
    return item as MenuItem;
  }

  items: MenuItem[] = [
    {
      label: 'Home',
      icon: 'lucideHome',
      routerLink: '/app',
    },
    {
      label: 'New Game',
      icon: 'lucidePlay',
      command: () => {
        this.newGameDialogVisible.set(true);
      },
    },
    {
      label: 'Seeks',
      icon: 'lucideSwords',
      command: () => {
        this.seeksDialogVisible.set(true);
      },
    },
    {
      label: 'Games',
      icon: 'lucideEye',
      command: () => {
        this.gamesDialogVisible.set(true);
      },
    },
    {
      label: 'Settings',
      icon: 'lucideSettings',
      routerLink: '/app/settings',
    },
    {
      label: 'Account',
      icon: 'lucideUser',
      routerLink: '/app/account',
    },
  ];

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
