/// WASM bindings for Sitelen Sitelen renderer

use sitelen_core::{OutputFormat, Pipeline, RenderConfig, init_glyph_registry};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub struct SitelenRenderer {
    pipeline: Pipeline,
}

#[wasm_bindgen]
impl SitelenRenderer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<SitelenRenderer, JsValue> {
        console_log!("Initializing Sitelen Sitelen renderer...");
        
        let config = RenderConfig::default();
        let pipeline = Pipeline::with_config(config)
            .map_err(|e| JsValue::from_str(&format!("Failed to create pipeline: {}", e)))?;
        
        Ok(SitelenRenderer { pipeline })
    }

    #[wasm_bindgen]
    pub fn render(&self, text: &str, format: &str) -> Result<Vec<u8>, JsValue> {
        let output_format = match format {
            "svg" => OutputFormat::Svg,
            "png" => OutputFormat::Png,
            "html" => OutputFormat::Html,
            _ => return Err(JsValue::from_str("Invalid format. Use 'svg', 'png', or 'html'")),
        };

        self.pipeline
            .render_text(text, output_format)
            .map_err(|e| JsValue::from_str(&format!("Rendering failed: {}", e)))
    }

    #[wasm_bindgen]
    pub fn render_svg(&self, text: &str) -> Result<Vec<u8>, JsValue> {
        self.render(text, "svg")
    }

    #[wasm_bindgen]
    pub fn render_png(&self, text: &str) -> Result<Vec<u8>, JsValue> {
        self.render(text, "png")
    }

    #[wasm_bindgen]
    pub fn render_html(&self, text: &str) -> Result<Vec<u8>, JsValue> {
        self.render(text, "html")
    }
}

#[wasm_bindgen]
pub fn render(text: &str, format: &str) -> Result<Vec<u8>, JsValue> {
    let renderer = SitelenRenderer::new()?;
    renderer.render(text, format)
}

#[wasm_bindgen]
pub fn render_svg(text: &str) -> Result<Vec<u8>, JsValue> {
    render(text, "svg")
}

#[wasm_bindgen]
pub fn render_png(text: &str) -> Result<Vec<u8>, JsValue> {
    render(text, "png")
}

#[wasm_bindgen]
pub fn render_html(text: &str) -> Result<Vec<u8>, JsValue> {
    render(text, "html")
}

/// Initialize the glyph registry with sprite content
/// This must be called before rendering, as WASM cannot access the file system
#[wasm_bindgen]
pub fn init_glyphs(sprite_content: &str) -> Result<(), JsValue> {
    init_glyph_registry(sprite_content)
        .map_err(|e| JsValue::from_str(&format!("Failed to initialize glyphs: {}", e)))
}

