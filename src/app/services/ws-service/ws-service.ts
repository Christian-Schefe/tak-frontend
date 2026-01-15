import { effect, inject, Injectable, signal } from '@angular/core';
import { webSocket } from 'rxjs/webSocket';
import { Observable, retry, RetryConfig, Subscriber, Subscription } from 'rxjs';
import z from 'zod';
import { IdentityService } from '../identity-service/identity-service';

const retryConfig: RetryConfig = {
  delay: 3000,
};

interface WsSubscription {
  type: string;
  parser: z.ZodType<unknown>;
  handler: (msg: unknown) => void;
}

const successParser = z.object({
  responseId: z.string(),
});

const errorParser = z.object({
  responseId: z.string(),
  message: z.string(),
  code: z.number(),
});

@Injectable({
  providedIn: 'root',
})
export class WsService {
  identityService = inject(IdentityService);
  websocket = webSocket({
    url: 'ws://localhost:3003/ws',
    openObserver: {
      next: () => {
        console.log('WebSocket connection opened');
        this.connected.set(true);
        this.authenticated.set(false);
      },
    },
    closeObserver: {
      next: () => {
        console.log('WebSocket connection closed');
        this.connected.set(false);
        this.authenticated.set(false);
      },
    },
  });

  private subscriptions = new Map<string, WsSubscription>();

  private inFlightMessages = new Map<string, Subscriber<unknown>>();

  connected = signal(false);
  authenticated = signal(false);
  private wsSubscription: Subscription | null = null;

  initialize() {
    effect(() => {
      const identity = this.identityService.identity();

      if (this.wsSubscription) {
        this.wsSubscription.unsubscribe();
      }
      if (identity) {
        console.log('Connecting WebSocket with identity:', identity);
        this.wsSubscription = this.connect();
      }
    });
    effect(() => {
      const identity = this.identityService.identity();
      const connected = this.connected();
      const authenticated = this.authenticated();

      if (connected && !authenticated && identity) {
        console.log('Authenticating WebSocket with identity:', identity);
        this.sendAuthenticateMessage(identity.wsJwt);
      }
    });
  }

  private connect() {
    console.log('WebSocket Service initialized');
    return this.websocket.pipe(retry(retryConfig)).subscribe({
      next: (msg) => {
        console.log('WebSocket message received:', msg);
        if (!msg || typeof msg !== 'object' || !('type' in msg) || typeof msg.type !== 'string') {
          console.error('Invalid WebSocket message format:', msg);
          return;
        }

        if (msg.type === 'success') {
          const parsed = successParser.safeParse(msg);
          if (!parsed.success) {
            console.error('WebSocket success message parsing failed:', parsed.error);
            return;
          }
          const responseId = parsed.data.responseId;
          const subscriber = this.inFlightMessages.get(responseId);
          if (subscriber) {
            subscriber.next(parsed.data);
            subscriber.complete();
            this.inFlightMessages.delete(responseId);
          } else {
            console.error('No subscriber found for responseId:', responseId);
          }
          return;
        }

        if (msg.type === 'error') {
          const parsed = errorParser.safeParse(msg);
          if (!parsed.success) {
            console.error('WebSocket error message parsing failed:', parsed.error);
            return;
          }
          const responseId = parsed.data.responseId;
          const subscriber = this.inFlightMessages.get(responseId);
          if (subscriber) {
            subscriber.error(new Error(`Error ${parsed.data.code}: ${parsed.data.message}`));
            this.inFlightMessages.delete(responseId);
          } else {
            console.error('No subscriber found for responseId:', responseId);
          }
          return;
        }

        this.subscriptions.forEach((sub) => {
          if (sub.type === msg.type) {
            const parsed = sub.parser.safeParse(msg);
            if (!parsed.success) {
              console.error('WebSocket message parsing failed:', parsed.error);
              return;
            }
            sub.handler(parsed.data);
          }
        });
      },
      error: (err) => {
        console.error('WebSocket error:', err);
      },
    });
  }

  private sendAuthenticateMessage(jwt: string) {
    this.sendMessage('authenticate', { token: jwt }).subscribe((res) => {
      this.authenticated.set(true);
      console.log('WebSocket authenticated:', res);
    });
  }

  subscribe<D>(type: string, parser: z.ZodType<D>, handler: (msg: D) => void): () => void {
    const id = crypto.randomUUID();
    this.subscriptions.set(id, {
      type,
      parser: parser as z.ZodType<unknown>,
      handler: handler as (msg: unknown) => void,
    });
    console.log('WebSocket subscription added:', id);
    return () => {
      this.subscriptions.delete(id);
      console.log('WebSocket subscription removed:', id);
    };
  }

  subscribeEffect<D>(type: string, parser: z.ZodType<D>, handler: (msg: D) => void) {
    return effect((onCleanup) => {
      const unsubscribe = this.subscribe(type, parser, handler);
      onCleanup(() => {
        unsubscribe();
      });
    });
  }

  sendMessage(type: string, data: object) {
    return new Observable<unknown>((subscriber) => {
      const responseId = crypto.randomUUID();
      this.websocket.next({ type, ...data, responseId });
      this.inFlightMessages.set(responseId, subscriber);
    });
  }
}
