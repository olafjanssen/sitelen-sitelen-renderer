/// Glyph loading and management

use std::collections::HashMap;
use std::sync::OnceLock;

#[derive(Debug, thiserror::Error)]
pub enum GlyphError {
    #[error("Glyph not found: {0}")]
    NotFound(String),
    #[error("SVG parsing error: {0}")]
    ParseError(String),
}

/// Glyph registry
pub struct GlyphRegistry {
    word_glyphs: HashMap<String, String>,
    syllable_glyphs: HashMap<String, String>,
    container_glyphs: HashMap<String, String>,
    sprite: Option<String>,
}

impl GlyphRegistry {
    pub fn new() -> Self {
        Self {
            word_glyphs: HashMap::new(),
            syllable_glyphs: HashMap::new(),
            container_glyphs: HashMap::new(),
            sprite: None,
        }
    }

    /// Load sprite from SVG string
    pub fn load_sprite(&mut self, svg_content: &str) -> Result<(), GlyphError> {
        self.sprite = Some(svg_content.to_string());
        Ok(())
    }

    /// Get glyph SVG by ID
    pub fn get_glyph(&self, id: &str) -> Result<&str, GlyphError> {
        // For now, we'll use the sprite system
        // In a full implementation, we'd parse the sprite and extract individual glyphs
        if let Some(sprite) = &self.sprite {
            // Check if the ID exists in the sprite
            if sprite.contains(&format!("id=\"{}\"", id)) {
                // Return a reference to the sprite - in full implementation,
                // we'd extract just the symbol
                Ok(sprite)
            } else {
                Err(GlyphError::NotFound(id.to_string()))
            }
        } else {
            Err(GlyphError::NotFound(id.to_string()))
        }
    }

    /// Get word glyph ID
    pub fn word_glyph_id(word: &str) -> String {
        format!("tp-wg-{}", word)
    }

    /// Get syllable glyph ID
    pub fn syllable_glyph_id(syllable: &str) -> String {
        format!("tp-syl-{}", syllable)
    }

    /// Get container glyph ID
    pub fn container_glyph_id(separator: &str, ratio: f64) -> String {
        let variant = if ratio > 1.5 {
            "wide"
        } else if ratio < 0.667 {
            "tall"
        } else {
            ""
        };

        if variant.is_empty() {
            format!("tp-c-{}", separator)
        } else {
            format!("tp-c-{}-{}", separator, variant)
        }
    }
}

impl Default for GlyphRegistry {
    fn default() -> Self {
        Self::new()
    }
}

/// Global glyph registry (lazy loaded)
static GLYPH_REGISTRY: OnceLock<GlyphRegistry> = OnceLock::new();

/// Initialize glyph registry with sprite
pub fn init_glyph_registry(sprite_content: &str) -> Result<(), GlyphError> {
    let mut registry = GlyphRegistry::new();
    registry.load_sprite(sprite_content)?;
    GLYPH_REGISTRY.set(registry).map_err(|_| {
        GlyphError::ParseError("Failed to initialize glyph registry".to_string())
    })?;
    Ok(())
}

/// Get glyph registry
pub fn get_glyph_registry() -> Option<&'static GlyphRegistry> {
    GLYPH_REGISTRY.get()
}

