import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WsService } from '../../services/ws-service/ws-service';

@Component({
  selector: 'app-home-route',
  imports: [RouterOutlet],
  templateUrl: './home-route.html',
  styleUrl: './home-route.css',
})
export class HomeRoute {
  wsService = inject(WsService);

  constructor() {
    this.wsService.websocket.subscribe((msg) => {
      console.log('App component received WebSocket message:', msg);
    });
  }
}
