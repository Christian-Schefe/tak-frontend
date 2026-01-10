import { inject, Injectable } from '@angular/core';
import { webSocket } from 'rxjs/webSocket';
import { IdentityService } from '../identity-service/identity-service';

@Injectable({
  providedIn: 'root',
})
export class WsService {
  websocket = webSocket('ws://localhost:3003/ws');
  identityService = inject(IdentityService);

  constructor() {
    console.log('WebSocket Service initialized');
    this.websocket.subscribe((msg) => {
      console.log('WebSocket message received:', msg);
    });

    this.websocket.next({ type: 'hello', payload: 'Hello WebSocket Server!' });
  }
}
