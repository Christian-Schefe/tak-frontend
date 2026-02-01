import { Component } from '@angular/core';
import { AppNavComponent } from '../../components/app-nav-component/app-nav-component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-app-layout',
  imports: [AppNavComponent, RouterOutlet],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.css',
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppLayout {}
