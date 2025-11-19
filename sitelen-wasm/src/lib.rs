/// WASM bindings for Sitelen Sitelen renderer

use sitelen_core::{OutputFormat, Pipeline, RenderConfig, init_glyph_registry};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;
use once_cell::sync::Lazy;
use std::sync::Mutex;

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

// Singleton pipeline instance (using Mutex for thread safety, though WASM is single-threaded)
static PIPELINE: Lazy<Mutex<Option<Pipeline>>> = Lazy::new(|| {
    Mutex::new(None)
});

/// Get or create the pipeline singleton and execute a closure with it
fn with_pipeline<F, R>(f: F) -> Result<R, JsValue>
where
    F: FnOnce(&mut Pipeline) -> Result<R, JsValue>,
{
    let mut pipeline_opt = PIPELINE.lock().unwrap();
    
    if pipeline_opt.is_none() {
        let config = RenderConfig::default();
        let pipeline = Pipeline::with_config(config)
            .map_err(|e| JsValue::from_str(&format!("Failed to create pipeline: {}", e)))?;
        *pipeline_opt = Some(pipeline);
    }
    
    f(pipeline_opt.as_mut().unwrap())
}

/// Get or create a pipeline with a specific optimal ratio
fn get_pipeline_with_ratio(optimal_ratio: f64) -> Result<Pipeline, JsValue> {
    let mut config = RenderConfig::default();
    config.optimal_ratio = optimal_ratio;
    Pipeline::with_config(config)
        .map_err(|e| JsValue::from_str(&format!("Failed to create pipeline: {}", e)))
}

/// Initialize glyph registry (called automatically, but can be called manually for custom sprites)
#[wasm_bindgen(start)]
pub fn init() {
    // Initialize with embedded sprite on module load
    if let Err(e) = init_glyph_registry(SPRITE_CONTENT) {
        console_log!("Warning: Failed to initialize embedded glyphs: {}", e);
    }
}

/// Render text to SVG string
/// 
/// # Arguments
/// * `text` - Toki Pona text to render
/// * `optimal_ratio` - Optional optimal ratio for layout (if None, uses default)
#[wasm_bindgen]
pub fn render_svg(text: &str, optimal_ratio: Option<f64>) -> Result<String, JsValue> {
    let bytes = if let Some(ratio) = optimal_ratio {
        let pipeline = get_pipeline_with_ratio(ratio)?;
        pipeline.render_text(text, OutputFormat::Svg)
            .map_err(|e| JsValue::from_str(&format!("Rendering failed: {}", e)))?
    } else {
        with_pipeline(|pipeline| {
            pipeline.render_text(text, OutputFormat::Svg)
                .map_err(|e| JsValue::from_str(&format!("Rendering failed: {}", e)))
        })?
    };
    
    String::from_utf8(bytes)
        .map_err(|e| JsValue::from_str(&format!("Invalid SVG UTF-8: {}", e)))
}

/// Render text to PNG bytes
/// 
/// # Arguments
/// * `text` - Toki Pona text to render
/// * `optimal_ratio` - Optional optimal ratio for layout (if None, uses default)
#[wasm_bindgen]
pub fn render_png(text: &str, optimal_ratio: Option<f64>) -> Result<Vec<u8>, JsValue> {
    if let Some(ratio) = optimal_ratio {
        let pipeline = get_pipeline_with_ratio(ratio)?;
        pipeline.render_text(text, OutputFormat::Png)
            .map_err(|e| JsValue::from_str(&format!("Rendering failed: {}", e)))
    } else {
        with_pipeline(|pipeline| {
            pipeline.render_text(text, OutputFormat::Png)
                .map_err(|e| JsValue::from_str(&format!("Rendering failed: {}", e)))
        })
    }
}

/// Get all available layout option ratios for a text
/// Returns a JSON array of ratios sorted from smallest to largest
#[wasm_bindgen]
pub fn get_layout_ratios(text: &str) -> Result<String, JsValue> {
    with_pipeline(|pipeline| {
        let sentences = pipeline.parse(text)
            .map_err(|e| JsValue::from_str(&format!("Parse failed: {}", e)))?;
        
        if sentences.is_empty() {
            return Ok("[]".to_string());
        }
        
        // For interactive rendering, we work with the first sentence as a whole
        // (not split by punctuation like in render_text)
        let sentence = &sentences[0];
        let options = pipeline.layout(sentence);
        
        let mut ratios: Vec<f64> = options.iter().map(|opt| opt.ratio).collect();
        ratios.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        
        serde_json::to_string(&ratios)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize ratios: {}", e)))
    })
}

/// Render each parsed sentence to its own SVG
/// Returns concatenated SVG strings, one per sentence
#[wasm_bindgen]
pub fn render_sentences(text: &str, optimal_ratio: Option<f64>) -> Result<String, JsValue> {
    if let Some(ratio) = optimal_ratio {
        let pipeline = get_pipeline_with_ratio(ratio)?;
        let sentences = pipeline.parse(text)
            .map_err(|e| JsValue::from_str(&format!("Parse failed: {}", e)))?;

        if sentences.is_empty() {
            return Ok(String::new());
        }

        let mut result = String::new();
        for sentence in &sentences {
            let bytes = pipeline.render_sentence(sentence, OutputFormat::Svg)
                .map_err(|e| JsValue::from_str(&format!("Rendering failed: {}", e)))?;
            let svg = String::from_utf8(bytes)
                .map_err(|e| JsValue::from_str(&format!("Invalid SVG UTF-8: {}", e)))?;
            result.push_str(&svg);
            result.push('\n');
        }

        Ok(result)
    } else {
        with_pipeline(|pipeline| {
            let sentences = pipeline.parse(text)
                .map_err(|e| JsValue::from_str(&format!("Parse failed: {}", e)))?;

            if sentences.is_empty() {
                return Ok(String::new());
            }

            let mut result = String::new();
            for sentence in &sentences {
                let bytes = pipeline.render_sentence(sentence, OutputFormat::Svg)
                    .map_err(|e| JsValue::from_str(&format!("Rendering failed: {}", e)))?;
                let svg = String::from_utf8(bytes)
                    .map_err(|e| JsValue::from_str(&format!("Invalid SVG UTF-8: {}", e)))?;
                result.push_str(&svg);
                result.push('\n');
            }

            Ok(result)
        })
    }
}

/// Initialize the glyph registry with custom sprite content
/// This allows overriding the default embedded sprite with a custom one
#[wasm_bindgen]
pub fn init_glyphs(sprite_content: &str) -> Result<(), JsValue> {
    init_glyph_registry(sprite_content)
        .map_err(|e| JsValue::from_str(&format!("Failed to initialize glyphs: {}", e)))
}
