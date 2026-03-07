import {
  computed,
  inject,
  Injectable,
  Injector,
  runInInjectionContext,
  Signal,
  untracked,
} from '@angular/core';
import {
  SmartHttpResource,
  smartHttpResource,
} from '../../util/smart-http-resource/smart-http-resource';
import z from 'zod';

export const PIECE_PRESETS = ['basic', 'bevel'];

const model = z.object({
  fileName: z.string(),
  scale: z.number().default(1),
  offset: z.array(z.number()).length(3).optional(),
  standingOffset: z.array(z.number()).length(3).optional(),
  stackedOffset: z.array(z.number()).length(3).optional(),
  stackedStandingOffset: z.array(z.number()).length(3).optional(),
  standingRotation: z.array(z.number()).length(3).optional(),
});

const piecePreset = z.object({
  whitePieceModel: model,
  blackPieceModel: model,
  whiteCapstoneModel: model,
  blackCapstoneModel: model,

  pieceHeight: z.number(),
});

const boardPreset = z.object({
  texture: z.object({
    '3x3': z.object({
      fileName: z.string(),
    }),
    '4x4': z.object({
      fileName: z.string(),
    }),
    '5x5': z.object({
      fileName: z.string(),
    }),
    '6x6': z.object({
      fileName: z.string(),
    }),
    '7x7': z.object({
      fileName: z.string(),
    }),
    '8x8': z.object({
      fileName: z.string(),
    }),
  }),
});

const tablePreset = z.object({
  model: z.object({
    fileName: z.string(),
  }),
  texture: z.object({
    fileName: z.string(),
  }),
});

export type PiecePreset = z.infer<typeof piecePreset>;
export type BoardPreset = z.infer<typeof boardPreset>;
export type TablePreset = z.infer<typeof tablePreset>;

type Board3dPresetType = 'piece' | 'board' | 'table';

const notFoundTexture = '/fallback/not_found.png';
const notFoundModel = '/fallback/not_found.glb';

@Injectable({
  providedIn: 'root',
})
export class Board3dPresetService {
  private injector = inject(Injector);

  private piecePresetCache = new Map<string, SmartHttpResource<PiecePreset>>();
  private boardPresetCache = new Map<string, SmartHttpResource<BoardPreset>>();
  private tablePresetCache = new Map<string, SmartHttpResource<TablePreset>>();

  private getPreset<T>(
    schema: z.ZodType<T>,
    path: () => string | undefined,
    type: Board3dPresetType,
  ): SmartHttpResource<T> {
    return smartHttpResource<T>(schema, () => {
      const p = path();
      if (p === undefined) {
        return undefined;
      }
      return `/board-3d/${type}/${p}/${type}.json`;
    });
  }

  getComputedResource<Out>(
    pathFn: () => string | undefined,
    getFn: (path: () => string) => SmartHttpResource<Out>,
    cache: Map<string, SmartHttpResource<Out>>,
  ): Signal<SmartHttpResource<Out> | undefined> {
    return computed(() => {
      const path = pathFn();
      if (path === undefined || path === '') {
        return undefined;
      }
      const cached = cache.get(path);
      if (cached) {
        return cached;
      }
      const resource = untracked(() =>
        runInInjectionContext(this.injector, () => {
          const p = path;
          return getFn(() => p);
        }),
      );
      cache.set(path, resource);
      return resource;
    });
  }

  getComputedPiecePreset(
    pathFn: () => string | undefined,
  ): Signal<SmartHttpResource<PiecePreset> | undefined> {
    return this.getComputedResource(
      pathFn,
      (path) => this.getPreset(piecePreset, path, 'piece'),
      this.piecePresetCache,
    );
  }

  getComputedBoardPreset(
    pathFn: () => string | undefined,
  ): Signal<SmartHttpResource<BoardPreset> | undefined> {
    return this.getComputedResource(
      pathFn,
      (path) => this.getPreset(boardPreset, path, 'board'),
      this.boardPresetCache,
    );
  }

  getComputedTablePreset(
    pathFn: () => string | undefined,
  ): Signal<SmartHttpResource<TablePreset> | undefined> {
    return this.getComputedResource(
      pathFn,
      (path) => this.getPreset(tablePreset, path, 'table'),
      this.tablePresetCache,
    );
  }

  getPresetPath(
    type: Board3dPresetType,
    presetPath: string,
    innerPath: string | undefined,
    fileType: 'model' | 'texture',
  ): string {
    return innerPath !== undefined
      ? `/board-3d/${type}/${presetPath}/${innerPath}`
      : fileType === 'texture'
        ? notFoundTexture
        : notFoundModel;
  }
}
