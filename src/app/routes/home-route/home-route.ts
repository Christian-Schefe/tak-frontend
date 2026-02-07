import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-home-route',
  imports: [CardModule, ButtonModule, RouterLink, RippleModule],
  templateUrl: './home-route.html',
  styleUrl: './home-route.css',
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class HomeRoute {}
