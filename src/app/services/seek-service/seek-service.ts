import { HttpClient, httpResource } from '@angular/common/http';
import { effect, inject, Injectable, linkedSignal, signal } from '@angular/core';
import { WsService } from '../ws-service/ws-service';
import z from 'zod';
import { GameSettings, gameSettings } from '../game-service/game-service';

export type SeekInfo = z.infer<typeof seekInfo>;

const seekInfo = z.object({
  id: z.number(),
  creatorId: z.string(),
  opponentId: z.string().nullable(),
  color: z.string(),
  isRated: z.boolean(),
  gameSettings,
});

const seekId = z.number();

export interface CreateSeekPayload {
  opponentId: string | null;
  color: string;
  isRated: boolean;
  gameSettings: GameSettings;
}

@Injectable({
  providedIn: 'root',
})
export class SeekService {
  wsService = inject(WsService);
  httpClient = inject(HttpClient);

  seeks = linkedSignal<SeekInfo[] | undefined, SeekInfo[]>({
    source: () => {
      if (this.seeksResource.hasValue()) {
        return this.seeksResource.value();
      }
      return undefined;
    },
    computation: (source, prev) => {
      if (!source) {
        return prev?.value ?? [];
      }
      return source;
    },
  });

  private refetchSignal = signal(0);

  seeksResource = httpResource<SeekInfo[]>(() => {
    this.refetchSignal();
    return '/api2/seeks';
  });

  refetchSeeks() {
    console.log('Refetching seeks');
    this.refetchSignal.update((n) => n + 1);
  }

  constructor() {
    effect(() => {
      if (this.wsService.connected()) {
        this.refetchSeeks();
      }
    });
    effect((onCleanup) => {
      const cleanup = this.wsService.subscribe(
        'seekCreated',
        z.object({ seek: seekInfo }),
        ({ seek }) => {
          this.seeks.update((seeks) => {
            return [...seeks, seek];
          });
        },
      );
      onCleanup(() => {
        cleanup();
      });
    });
    effect((onCleanup) => {
      const cleanup = this.wsService.subscribe(
        'seekRemoved',
        z.object({ seekId }),
        ({ seekId }) => {
          this.seeks.update((seeks) => {
            return seeks.filter((seek) => seek.id !== seekId);
          });
        },
      );
      onCleanup(() => {
        cleanup();
      });
    });
  }

  createSeek(payload: CreateSeekPayload) {
    return this.httpClient.post(`/api2/seeks`, payload);
  }

  acceptSeek(seekId: number) {
    return this.httpClient.post(`/api2/seeks/accept`, { seekId });
  }
}
