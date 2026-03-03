/// <reference lib="webworker" />

import z from 'zod';
import init, { Engine, initialize } from '../../tak-wasm-engine/pkg';

let engine: Engine | null = null;

async function assertInit() {
  if (!engine) {
    await init({
      module_or_path: '/wasm/tak_wasm_engine_bg.wasm',
    });
    initialize();
    engine = new Engine();
  }
  return engine;
}

const messageSchema = z.object({
  message: z.string(),
});

addEventListener('message', ({ data }) => {
  void assertInit().then((engine) => {
    const parsed = messageSchema.safeParse(data);
    if (!parsed.success) {
      postMessage({ error: `Invalid data format: ${parsed.error.message}` });
      return;
    }
    const message = parsed.data;

    engine.send_tei(message.message);
  });
});
