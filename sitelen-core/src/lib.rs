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


/// Main pipeline for rendering Toki Pona text
pub struct Pipeline {
    parser: Parser,
    layout_engine: LayoutEngine,
    renderer: std::cell::RefCell<Renderer>,
}

impl Pipeline {
    /// Create a new pipeline with default configuration
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let config = RenderConfig::default();
        Self::with_config(config)
    }

    /// Create a new pipeline with custom configuration
    pub fn with_config(config: RenderConfig) -> Result<Self, Box<dyn std::error::Error>> {
        // Embed the sprite file at compile time
        const SPRITE_CONTENT: &str = include_str!("../../images/glyphs.svg");
        init_glyph_registry(SPRITE_CONTENT)?;

        Ok(Self {
            parser: Parser::new(),
            layout_engine: LayoutEngine::new(),
            renderer: std::cell::RefCell::new(Renderer::new(config)),
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
    pub fn select_best_layout<'a>(
        &self,
        options: &'a [LayoutOption],
        optimal_ratio: f64,
    ) -> Option<&'a LayoutOption> {
        options.iter().min_by(|a, b| {
            let a_diff = (a.ratio - optimal_ratio).abs();
            let b_diff = (b.ratio - optimal_ratio).abs();
            a_diff
                .partial_cmp(&b_diff)
                .unwrap_or(std::cmp::Ordering::Equal)
        })
    }

    /// Render a layout to bytes
    pub fn render(&self, layout: &Layout, format: OutputFormat) -> Result<Vec<u8>, RenderError> {
        self.renderer.borrow_mut().render(layout, format)
    }

    /// Render a single parsed sentence to bytes
    pub fn render_sentence(
        &self,
        sentence: &Sentence,
        format: OutputFormat,
    ) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let mut compounds = Vec::new();
        let optimal_ratio = self.renderer.borrow().config.optimal_ratio;

        // Split sentence into compounds at punctuation and select best layout per compound
        let mut sentence_compound = Vec::new();
        for part in &sentence.parts {
            sentence_compound.push(part.clone());
            if matches!(part, SentencePart::Punctuation { .. }) {
                let compound_sentence = Sentence {
                    parts: sentence_compound.clone(),
                };
                let options = self.layout(&compound_sentence);
                if let Some(best) = self.select_best_layout(&options, optimal_ratio) {
                    compounds.push(best.clone());
                } else if let Some(first) = options.first() {
                    compounds.push(first.clone());
                }
                sentence_compound.clear();
            }
        }
        if !sentence_compound.is_empty() {
            let compound_sentence = Sentence {
                parts: sentence_compound,
            };
            let options = self.layout(&compound_sentence);
            if let Some(best) = self.select_best_layout(&options, optimal_ratio) {
                compounds.push(best.clone());
            } else if let Some(first) = options.first() {
                compounds.push(first.clone());
            }
        }

        let layout = Layout { compounds };
        let bytes = self.render(&layout, format)?;
        Ok(bytes)
    }

    /// Complete pipeline: parse, layout, and render
    pub fn render_text(
        &self,
        text: &str,
        format: OutputFormat,
    ) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let sentences = self.parse(text)?;

        let mut compounds = Vec::new();
        let optimal_ratio = self.renderer.borrow().config.optimal_ratio;

        for sentence in sentences {
            // Split sentence into compounds at punctuation marks (like JavaScript does)
            let mut sentence_compound = Vec::new();

            for part in &sentence.parts {
                sentence_compound.push(part.clone());

                // When we encounter punctuation, finalize current compound and start a new one
                if matches!(part, SentencePart::Punctuation { .. }) {
                    let compound_sentence = Sentence {
                        parts: sentence_compound.clone(),
                    };
                    let options = self.layout(&compound_sentence);
                    if let Some(best) = self.select_best_layout(&options, optimal_ratio) {
                        compounds.push(best.clone());
                    } else if let Some(first) = options.first() {
                        compounds.push(first.clone());
                    }
                    sentence_compound.clear();
                }
            }

            // If there are remaining parts (no trailing punctuation), add them as a final compound
            if !sentence_compound.is_empty() {
                let compound_sentence = Sentence {
                    parts: sentence_compound,
                };
                let options = self.layout(&compound_sentence);
                if let Some(best) = self.select_best_layout(&options, optimal_ratio) {
                    compounds.push(best.clone());
                } else if let Some(first) = options.first() {
                    compounds.push(first.clone());
                }
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
