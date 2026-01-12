import { Injectable } from '@angular/core';
import { webSocket } from 'rxjs/webSocket';
import { Observable, retry, RetryConfig, Subscriber } from 'rxjs';
import z from 'zod';

const retryConfig: RetryConfig = {
  delay: 3000,
};

interface Subscription {
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
  websocket = webSocket('ws://localhost:3003/ws');

  private subscriptions = new Map<string, Subscription>();

  private inFlightMessages = new Map<string, Subscriber<unknown>>();

  connect(jwt: string) {
    console.log('WebSocket Service initialized');
    this.websocket.pipe(retry(retryConfig)).subscribe({
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

    this.sendMessage('authenticate', { token: jwt }).subscribe((res) => {
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

  sendMessage(type: string, data: object) {
    return new Observable<unknown>((subscriber) => {
      const responseId = crypto.randomUUID();
      this.websocket.next({ type, ...data, responseId });
      this.inFlightMessages.set(responseId, subscriber);
    });
  }
}
