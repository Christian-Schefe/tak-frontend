import { Injectable } from '@angular/core';
import z from 'zod';

const workerResponse = z.union([
  z.object({
    type: z.literal('tei'),
    message: z.string(),
  }),
  z.object({
    type: z.literal('loaded'),
  }),
]);

export type WorkerResponse = Exclude<z.infer<typeof workerResponse>, { type: 'loaded' }>;

function safeParseJson<T>(
  schema: z.ZodType<T>,
  json: unknown,
): { success: true; data: T } | { success: false; error: unknown } {
  if (typeof json !== 'string') {
    return { success: false, error: new Error('Input is not a valid JSON string') };
  }
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(json);
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse JSON string: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
  const parsed = schema.safeParse(parsedJson);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }
  return { success: true, data: parsed.data };
}

@Injectable({
  providedIn: 'root',
})
export class EngineService {
  private workers = new Map<string, Worker>();

  private async getWorker(id: string): Promise<Worker> {
    const worker = this.workers.get(id);
    if (worker) {
      return worker;
    }

    const newWorker = new Worker(new URL('../../workers/engine.worker', import.meta.url));
    this.workers.set(id, newWorker);

    return new Promise((resolve) => {
      newWorker.onmessage = ({ data }) => {
        const parsedResponse = safeParseJson(workerResponse, data);
        if (!parsedResponse.success) {
          console.error('Invalid response structure from worker:', data, parsedResponse.error);
          return;
        }
        if (parsedResponse.data.type === 'loaded') {
          console.log('Worker loaded:', id);
          resolve(newWorker);
        }
      };

      resolve(newWorker);
    });
  }

  async initialize(id: string, callback: (message: WorkerResponse) => void) {
    const worker = await this.getWorker(id);
    worker.onmessage = ({ data }) => {
      const parsed = safeParseJson(workerResponse, data);
      if (!parsed.success) {
        console.error('Invalid response from worker:', data, parsed.error);
        throw new Error('Invalid response from worker');
      }
      if (parsed.data.type !== 'loaded') {
        callback(parsed.data);
      }
    };
    worker.postMessage({ message: 'tei' });
  }

  async sendMessage(id: string, message: string) {
    const worker = await this.getWorker(id);
    worker.postMessage({ message });
  }
}
