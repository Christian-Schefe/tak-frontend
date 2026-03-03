use wasm_bindgen::prelude::*;
use web_sys::DedicatedWorkerGlobalScope;

use crate::tei::run;

mod tei;

#[wasm_bindgen]
pub fn initialize() {
    console_error_panic_hook::set_once();
    send_output(Output::Loaded);
}

#[wasm_bindgen]
pub struct Engine {
    sender: async_channel::Sender<String>,
}

#[wasm_bindgen]
impl Engine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Engine {
        let sender = run();
        Engine { sender }
    }

    pub fn send_tei(&mut self, input: String) -> Result<(), String> {
        self.sender.try_send(input).map_err(|e| e.to_string())
    }
}

#[derive(serde::Serialize)]
#[serde(
    tag = "type",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum Output {
    Loaded,
    Tei { message: String },
}

fn worker_scope() -> DedicatedWorkerGlobalScope {
    js_sys::global().unchecked_into::<DedicatedWorkerGlobalScope>()
}

fn send_output(output: Output) {
    let scope = worker_scope();
    scope
        .post_message(&JsValue::from_str(&serde_json::to_string(&output).unwrap()))
        .unwrap();
}
