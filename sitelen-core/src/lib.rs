/// Sitelen Sitelen Renderer - Core Library
/// 
/// This library converts Toki Pona text into the Sitelen Sitelen non-linear writing style.

pub mod config;
pub mod glyphs;
pub mod layout;
pub mod parser;
pub mod renderer;
pub mod types;

pub use config::{OutputFormat, RenderConfig};
pub use glyphs::{init_glyph_registry, GlyphError, GlyphRegistry};
pub use layout::LayoutEngine;
pub use parser::{ParseError, Parser};
pub use renderer::{RenderError, Renderer};
pub use types::{Layout, Sentence, SentencePart};

use std::fs;

/// Main pipeline for rendering Toki Pona text
pub struct Pipeline {
    parser: Parser,
    layout_engine: LayoutEngine,
    renderer: Renderer,
}

impl Pipeline {
    /// Create a new pipeline with default configuration
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let config = RenderConfig::default();
        Self::with_config(config)
    }

    /// Create a new pipeline with custom configuration
    pub fn with_config(config: RenderConfig) -> Result<Self, Box<dyn std::error::Error>> {
        // Load sprite if available
        let sprite_path = "images/sprite.css.svg";
        if let Ok(sprite_content) = fs::read_to_string(sprite_path) {
            init_glyph_registry(&sprite_content)?;
        }

        Ok(Self {
            parser: Parser::new(),
            layout_engine: LayoutEngine::new(),
            renderer: Renderer::new(config),
        })
    }

    /// Parse Toki Pona text into structured sentences
    pub fn parse(&self, text: &str) -> Result<Vec<Sentence>, ParseError> {
        self.parser.parse(text)
    }

    /// Layout a sentence into layout options
    pub fn layout(&self, sentence: &Sentence) -> Vec<LayoutOption> {
        self.layout_engine.layout_compound(sentence)
    }

    /// Select the best layout option based on optimal ratio
    pub fn select_best_layout<'a>(&self, options: &'a [LayoutOption], optimal_ratio: f64) -> Option<&'a LayoutOption> {
        options.iter().min_by(|a, b| {
            let a_diff = (a.ratio - optimal_ratio).abs();
            let b_diff = (b.ratio - optimal_ratio).abs();
            a_diff.partial_cmp(&b_diff).unwrap_or(std::cmp::Ordering::Equal)
        })
    }

    /// Render a layout to bytes
    pub fn render(&self, layout: &Layout, format: OutputFormat) -> Result<Vec<u8>, RenderError> {
        self.renderer.render(layout, format)
    }

    /// Complete pipeline: parse, layout, and render
    pub fn render_text(&self, text: &str, format: OutputFormat) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let sentences = self.parse(text)?;
        
        let mut compounds = Vec::new();
        for sentence in sentences {
            let options = self.layout(&sentence);
            if let Some(best) = self.select_best_layout(&options, self.renderer.config.optimal_ratio) {
                compounds.push(best.clone());
            } else if let Some(first) = options.first() {
                compounds.push(first.clone());
            }
        }

        let layout = Layout { compounds };
        let bytes = self.render(&layout, format)?;
        Ok(bytes)
    }
}

impl Default for Pipeline {
    fn default() -> Self {
        Self::new().expect("Failed to create pipeline")
    }
}

use crate::types::LayoutOption;

