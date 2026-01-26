use roxmltree::Document;
/// Glyph loading and management
use std::collections::HashSet;
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
    sprite: Option<String>,
}

impl GlyphRegistry {
    pub fn new() -> Self {
        Self { sprite: None }
    }

    /// Load sprite from SVG string
    pub fn load_sprite(&mut self, svg_content: &str) -> Result<(), GlyphError> {
        // Strip DOCTYPE declaration as roxmltree doesn't support DTD
        let cleaned = Self::strip_doctype(svg_content);
        self.sprite = Some(cleaned);
        Ok(())
    }

    /// Strip DOCTYPE declaration from XML
    fn strip_doctype(xml: &str) -> String {
        use regex::Regex;
        // Remove DOCTYPE declaration (may span multiple lines)
        let re = Regex::new(r"(?s)<!DOCTYPE[^>]*>").unwrap();
        re.replace_all(xml, "").to_string()
    }

    /// Extract a symbol from the sprite by ID
    pub fn extract_symbol(&self, id: &str) -> Result<String, GlyphError> {
        if let Some(sprite) = &self.sprite {
            // Strip DOCTYPE if present (should already be stripped, but double-check)
            let cleaned = Self::strip_doctype(sprite);
            let doc = Document::parse(&cleaned)
                .map_err(|e| GlyphError::ParseError(format!("Failed to parse sprite: {}", e)))?;

            // Find the symbol element with the given ID
            if let Some(symbol) = doc
                .descendants()
                .find(|n| n.has_tag_name("symbol") && n.attribute("id") == Some(id))
            {
                // Serialize the symbol node and all its children
                Ok(self.serialize_node(&symbol))
            } else {
                Err(GlyphError::NotFound(id.to_string()))
            }
        } else {
            Err(GlyphError::NotFound(id.to_string()))
        }
    }

    /// Serialize an XML node to string
    fn serialize_node(&self, node: &roxmltree::Node) -> String {
        use std::fmt::Write;
        let mut result = String::new();
        write!(result, "<{}", node.tag_name().name()).unwrap();

        // Write attributes
        for attr in node.attributes() {
            let value = attr
                .value()
                .replace('&', "&amp;")
                .replace('<', "&lt;")
                .replace('>', "&gt;")
                .replace('"', "&quot;");
            write!(result, " {}=\"{}\"", attr.name(), value).unwrap();
        }

        // Check if node has children (elements or text)
        let has_element_children = node.children().any(|c| c.is_element());
        let text_nodes: Vec<&str> = node
            .children()
            .filter(|c| c.is_text())
            .map(|c| c.text().unwrap_or(""))
            .collect();
        let has_text = !text_nodes.is_empty();

        if !has_element_children && !has_text {
            write!(result, "/>").unwrap();
        } else {
            write!(result, ">").unwrap();

            // Add text content (preserve order with elements)
            for child in node.children() {
                if child.is_text() {
                    let text = child.text().unwrap_or("");
                    // Escape XML special characters in text
                    let escaped = text
                        .replace('&', "&amp;")
                        .replace('<', "&lt;")
                        .replace('>', "&gt;");
                    result.push_str(&escaped);
                } else if child.is_element() {
                    result.push_str(&self.serialize_node(&child));
                }
            }

            write!(result, "</{}>", node.tag_name().name()).unwrap();
        }
        result
    }

    /// Get all symbol IDs from the sprite
    pub fn get_all_symbol_ids(&self) -> HashSet<String> {
        let mut ids = HashSet::new();
        if let Some(sprite) = &self.sprite {
            let cleaned = Self::strip_doctype(sprite);
            if let Ok(doc) = Document::parse(&cleaned) {
                for node in doc.descendants() {
                    if node.has_tag_name("symbol") {
                        if let Some(id) = node.attribute("id") {
                            ids.insert(id.to_string());
                        }
                    }
                }
            }
        }
        ids
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
    GLYPH_REGISTRY
        .set(registry)
        .map_err(|_| GlyphError::ParseError("Failed to initialize glyph registry".to_string()))?;
    Ok(())
}

/// Get glyph registry
pub fn get_glyph_registry() -> Option<&'static GlyphRegistry> {
    GLYPH_REGISTRY.get()
}
