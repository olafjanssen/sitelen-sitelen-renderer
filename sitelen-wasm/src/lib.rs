/// WASM bindings for Sitelen Sitelen renderer

use sitelen_core::{OutputFormat, Pipeline, RenderConfig, init_glyph_registry};
use wasm_bindgen::prelude::*;

// Embed the sprite file at compile time
const SPRITE_CONTENT: &str = include_str!("../../images/sprite.css.svg");

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
    pub(crate) pipeline: Pipeline,
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

/// Initialize glyph registry (called automatically, but can be called manually for custom sprites)
#[wasm_bindgen(start)]
pub fn init() {
    // Initialize with embedded sprite on module load
    if let Err(e) = init_glyph_registry(SPRITE_CONTENT) {
        console_log!("Warning: Failed to initialize embedded glyphs: {}", e);
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

/// Initialize the glyph registry with custom sprite content
/// This allows overriding the default embedded sprite with a custom one
#[wasm_bindgen]
pub fn init_glyphs(sprite_content: &str) -> Result<(), JsValue> {
    init_glyph_registry(sprite_content)
        .map_err(|e| JsValue::from_str(&format!("Failed to initialize glyphs: {}", e)))
}

/// Get all layout option ratios for a text
/// Returns a JSON array of ratios sorted from smallest to largest
#[wasm_bindgen]
pub fn get_layout_ratios(text: &str) -> Result<String, JsValue> {
    let renderer = SitelenRenderer::new()?;
    let sentences = renderer.pipeline.parse(text)
        .map_err(|e| JsValue::from_str(&format!("Parse failed: {}", e)))?;
    
    if sentences.is_empty() {
        return Ok("[]".to_string());
    }
    
    // For interactive rendering, we work with the first sentence as a whole
    // (not split by punctuation like in render_text)
    let sentence = &sentences[0];
    let options = renderer.pipeline.layout(sentence);
    
    let mut ratios: Vec<f64> = options.iter().map(|opt| opt.ratio).collect();
    ratios.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    
    serde_json::to_string(&ratios)
        .map_err(|e| JsValue::from_str(&format!("Failed to serialize ratios: {}", e)))
}

/// Render text with a specific optimal ratio
#[wasm_bindgen]
pub fn render_with_ratio(text: &str, optimal_ratio: f64, format: &str) -> Result<Vec<u8>, JsValue> {
    let output_format = match format {
        "svg" => OutputFormat::Svg,
        "png" => OutputFormat::Png,
        "html" => OutputFormat::Html,
        _ => return Err(JsValue::from_str("Invalid format. Use 'svg', 'png', or 'html'")),
    };
    
    // Temporarily set the optimal ratio
    let mut config = RenderConfig::default();
    config.optimal_ratio = optimal_ratio;
    let temp_pipeline = Pipeline::with_config(config)
        .map_err(|e| JsValue::from_str(&format!("Failed to create pipeline: {}", e)))?;
    
    temp_pipeline.render_text(text, output_format)
        .map_err(|e| JsValue::from_str(&format!("Rendering failed: {}", e)))
}

/// Render SVG with a specific optimal ratio
#[wasm_bindgen]
pub fn render_svg_with_ratio(text: &str, optimal_ratio: f64) -> Result<Vec<u8>, JsValue> {
    render_with_ratio(text, optimal_ratio, "svg")
}

