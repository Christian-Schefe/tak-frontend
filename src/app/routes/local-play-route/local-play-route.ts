import { Component } from '@angular/core';
import { BoardNinjaComponent } from '../../components/board-ninja-component/board-ninja-component';

@Component({
  selector: 'app-local-play-route',
  imports: [BoardNinjaComponent],
  templateUrl: './local-play-route.html',
  styleUrl: './local-play-route.css',
})
export class LocalPlayRoute {}
