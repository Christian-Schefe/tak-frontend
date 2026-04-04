/// <reference lib="webworker" />

import init, {
  initialize,
  is_settings_supported,
  search_position,
  stop_searching,
} from '../../tak-wasm-engine/pkg';
import { workerInput } from '../services/engine-service/engine-service';

let initializingPromise: Promise<void> | null = null;

async function assertInit() {
  if (initializingPromise === null) {
    console.log('Initializing engine worker...');
    initializingPromise = init({
      module_or_path: '/wasm/tak_wasm_engine_bg.wasm',
    }).then(() => {
      console.log('Engine WASM module initialized');
      initialize();
      return;
    });
  }
  await initializingPromise;
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
    } else if (message.type === 'evaluate') {
      search_position(JSON.stringify(message.game.settings), message.game.tps);
    } else {
      stop_searching();
    }
  });
});
