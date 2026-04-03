/// <reference lib="webworker" />

import init, {
  initialize,
  is_settings_supported,
  search_position,
} from '../../tak-wasm-engine/pkg';
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

    if (message.type === 'checkSettings') {
      const result = is_settings_supported(JSON.stringify(message.settings));
      postMessage(JSON.stringify({ type: 'checkSettings', supported: result }));
    } else {
      search_position(JSON.stringify(message.game.settings), message.game.tps);
    }
  });
});
