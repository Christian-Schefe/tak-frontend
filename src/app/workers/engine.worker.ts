/// <reference lib="webworker" />

import init, { initialize, search_position } from '../../tak-wasm-engine/pkg';
import { workerInput } from '../services/engine-service/engine-service';

let isInit = false;

async function assertInit() {
  if (!isInit) {
    await init({
      module_or_path: '/wasm/tak_wasm_engine_bg.wasm',
    });
    initialize();
    isInit = true;
  }
  return isInit;
}

addEventListener('message', ({ data }) => {
  void assertInit().then(() => {
    const parsed = workerInput.safeParse(data);
    if (!parsed.success) {
      postMessage({ error: `Invalid data format: ${parsed.error.message}` });
      return;
    }
    const message = parsed.data;

    search_position(JSON.stringify(message.game.settings), message.game.tps);
  });
});
