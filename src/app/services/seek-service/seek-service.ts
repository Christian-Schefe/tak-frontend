import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, linkedSignal } from '@angular/core';
import { WsService } from '../ws-service/ws-service';
import z from 'zod';
import { GameSettings, gameSettings } from '../game-service/game-service';
import { smartHttpResource } from '../../util/smart-http-resource/smart-http-resource';

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

  seeksResource = smartHttpResource<SeekInfo[]>(z.array(seekInfo), () => '/api2/seeks');
  seeks = linkedSignal(() => this.seeksResource.lastValue() ?? []);

  private readonly _refreshSeeksOnWsConnectedEffect = effect(() => {
    if (this.wsService.connected()) {
      this.seeksResource.refetch();
    }
  });

  private readonly _seekCreatedEffect = this.wsService.subscribeEffect(
    'seekCreated',
    z.object({ seek: seekInfo }),
    ({ seek }) => {
      this.seeks.update((seeks) => {
        return [...seeks, seek];
      });
    },
  );

  private readonly _seekRemovedEffect = this.wsService.subscribeEffect(
    'seekRemoved',
    z.object({ seekId }),
    ({ seekId }) => {
      this.seeks.update((seeks) => {
        return seeks.filter((seek) => seek.id !== seekId);
      });
    },
  );

  createSeek(payload: CreateSeekPayload) {
    return this.httpClient.post(`/api2/seeks`, payload);
  }

  acceptSeek(seekId: number) {
    return this.httpClient.post(`/api2/seeks/${seekId}/accept`, {});
  }

  cancelSeek(seekId: number) {
    return this.httpClient.delete(`/api2/seeks/${seekId}`);
  }
}
