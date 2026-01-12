import { httpResource } from '@angular/common/http';
import { effect, inject, Injectable, linkedSignal, signal } from '@angular/core';
import { WsService } from '../ws-service/ws-service';
import z from 'zod';

export type SeekInfo = z.infer<typeof seekInfo>;

const seekInfo = z.object({
  id: z.number(),
  creatorId: z.string(),
  opponentId: z.string().nullable(),
  color: z.string(),
  boardSize: z.number(),
  halfKomi: z.number(),
  pieces: z.number(),
  capstones: z.number(),
  contingentMs: z.number(),
  incrementMs: z.number(),
  extra: z
    .object({
      on_move: z.number(),
      extra_ms: z.number(),
    })
    .nullable(),
  isRated: z.boolean(),
});

const seekId = z.number();

@Injectable({
  providedIn: 'root',
})
export class SeekService {
  wsService = inject(WsService);

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
    this.refetchSignal.update((n) => n + 1);
  }

  constructor() {
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
}
