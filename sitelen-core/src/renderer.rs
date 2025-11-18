/// SVG renderer for Sitelen Sitelen

use crate::config::{OutputFormat, RenderConfig};
use crate::glyphs::{get_glyph_registry, GlyphRegistry, GlyphError};
use crate::types::*;
use std::collections::HashSet;
use std::fmt::Write;

#[derive(Debug, thiserror::Error)]
pub enum RenderError {
    #[error("Glyph error: {0}")]
    Glyph(#[from] GlyphError),
    #[error("Layout error: {0}")]
    Layout(String),
    #[error("Rendering error: {0}")]
    Rendering(String),
}

/// Renderer for converting layouts to SVG
pub struct Renderer {
    pub config: RenderConfig,
    used_glyphs: HashSet<String>,
}

impl Renderer {
    pub fn new(config: RenderConfig) -> Self {
        Self {
            config,
            used_glyphs: HashSet::new(),
        }
    }

    /// Render a layout to SVG bytes
    pub fn render(&mut self, layout: &Layout, format: OutputFormat) -> Result<Vec<u8>, RenderError> {
        match format {
            OutputFormat::Svg => self.render_svg(layout),
            OutputFormat::Png => self.render_png(layout),
            OutputFormat::Html => self.render_html(layout),
        }
    }

    /// Render to SVG
    fn render_svg(&mut self, layout: &Layout) -> Result<Vec<u8>, RenderError> {
        // Clear used glyphs for this render
        self.used_glyphs.clear();
        
        let mut svg = String::new();
        
        // Calculate total size
        let mut x_size: f64 = 0.0;
        let mut y_size: f64 = 0.0;
        
        for option in &layout.compounds {
            x_size = x_size.max(option.size.width);
        }
        
        for option in &layout.compounds {
            y_size += option.size.height * x_size / option.size.width;
        }

        let box_width = x_size * 100.0;
        let box_height = y_size * 100.0;
        
        let viewbox_x = -(box_width * self.config.scale_skew - box_width) / 2.0;
        let viewbox_y = -(box_height * self.config.scale - box_height) / 2.0;
        let viewbox_width = box_width * self.config.scale_skew;
        let viewbox_height = box_height * self.config.scale;

        writeln!(
            svg,
            r#"<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.2" preserveAspectRatio="xMidYMin meet" viewBox="{} {} {} {}">"#,
            viewbox_x, viewbox_y, viewbox_width, viewbox_height
        ).unwrap();

        // Add style
        writeln!(
            svg,
            r#"<style>ellipse,polygon,polyline,rect,circle,line,path{{stroke-width:{};stroke:black;vector-effect:non-scaling-stroke}} .filler{{stroke:none;}}</style>"#,
            self.config.stroke_width
        ).unwrap();

        // Add shadow filter if needed
        if self.config.shadow {
            writeln!(
                svg,
                r#"<filter id="shadow" width="150%" height="150%"><feOffset result="offOut" in="SourceGraphic" dx="0" dy="2"></feOffset><feColorMatrix result="matrixOut" in="offOut" type="matrix" values="0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.2 0 0 0 0 0 1 0"></feColorMatrix><feGaussianBlur result="blurOut" in="matrixOut" stdDeviation="2"></feGaussianBlur><feBlend in="SourceGraphic" in2="blurOut" mode="normal"></feBlend></filter>"#
            ).unwrap();
        }

        // Render each compound
        let mut y_pos = 0.0;
        for option in &layout.compounds {
            let inner_width = x_size * 100.0;
            let inner_height = option.size.height * x_size / option.size.width * 100.0;
            
            writeln!(
                svg,
                r#"<svg width="{}" height="{}" viewBox="0 0 100 100" y="{}" preserveAspectRatio="none"{} style="overflow: visible;">"#,
                inner_width,
                inner_height,
                y_pos,
                if self.config.shadow { r#" filter="url(#shadow)""# } else { "" }
            ).unwrap();
            
            self.render_part_option(option, &mut svg, None, None, None)?;
            
            writeln!(svg, r#"</svg>"#).unwrap();
            
            y_pos += inner_height;
        }

        // If exportable, embed the used glyph symbols
        if self.config.exportable {
            if let Some(registry) = get_glyph_registry() {
                for glyph_id in &self.used_glyphs {
                    match registry.extract_symbol(glyph_id) {
                        Ok(symbol_xml) => {
                            svg.push_str(&symbol_xml);
                            svg.push('\n');
                        }
                        Err(e) => {
                            // Log warning but continue
                            eprintln!("Warning: Could not extract symbol {}: {}", glyph_id, e);
                        }
                    }
                }
            }
        }

        writeln!(svg, r#"</svg>"#).unwrap();

        Ok(svg.into_bytes())
    }

    /// Render part option recursively
    fn render_part_option(
        &mut self,
        option: &LayoutOption,
        svg: &mut String,
        position: Option<Position>,
        size_parent: Option<Size>,
        size_parent_normed: Option<Size>,
    ) -> Result<(), RenderError> {
        let glyph_scale = self.config.scale;
        let separator_scale = self.get_separator_scale(option, glyph_scale);
        let is_nested = position.is_some();
        let container_scale = self.get_container_scale(option, glyph_scale, is_nested);

        // Render separator at top level if present and no position (top-level compound)
        if position.is_none() {
            if let Some(separator) = &option.separator {
                // Calculate position based on option size
                let box_width = option.size.width * 100.0;
                let box_height = option.size.height * 100.0;
                let box_x = 0.0;
                let box_y = 0.0;
                
                let center_x = box_x + box_width / 2.0;
                let center_y = box_y + box_height / 2.0;

                let matrix = format!(
                    "matrix({},{},{},{},{},{})",
                    separator_scale[0],
                    0.0,
                    0.0,
                    separator_scale[1],
                    center_x - separator_scale[0] * center_x,
                    center_y - separator_scale[1] * center_y
                );

                if separator == "li" {
                    // Special case for li - render as rect
                    let max_size = option.size.width.max(option.size.height);
                    let rx = 15.0 / option.size.width * max_size / separator_scale[0];
                    let ry = 15.0 / option.size.height * max_size / separator_scale[1];
                    writeln!(
                        svg,
                        "<rect transform=\"{}\" height=\"{}\" width=\"{}\" x=\"{}\" y=\"{}\" rx=\"{}\" ry=\"{}\" fill=\"#fff\"></rect>",
                        matrix, box_height, box_width, box_x, box_y, rx, ry
                    ).unwrap();
                } else if separator == "cartouche" {
                    let container_id = GlyphRegistry::container_glyph_id(separator, option.ratio);
                    self.used_glyphs.insert(container_id.clone());
                    writeln!(
                        svg,
                        "<use xlink:href=\"#{}\" transform=\"{}\" height=\"{}\" width=\"{}\" x=\"{}\" y=\"{}\"></use>",
                        container_id, matrix, box_height, box_width, box_x, box_y
                    ).unwrap();
                } else {
                    let container_id = GlyphRegistry::container_glyph_id(separator, option.ratio);
                    self.used_glyphs.insert(container_id.clone());
                    writeln!(
                        svg,
                        "<use xlink:href=\"#{}\" transform=\"{}\" height=\"{}\" width=\"{}\" x=\"{}\" y=\"{}\"></use>",
                        container_id, matrix, box_height, box_width, box_x, box_y
                    ).unwrap();
                }
            }
        }

        // If we have a position, create a nested SVG container
        if let (Some(pos), Some(size_p), Some(size_pn)) = (position, size_parent, size_parent_normed) {
            let box_x = pos.x * 100.0 / size_pn.width;
            let box_y = pos.y * 100.0 / size_pn.height;
            let box_width = size_p.width * 100.0 / size_pn.width;
            let box_height = size_p.height * 100.0 / size_pn.height;
            
            let center_x = box_x + box_width / 2.0;
            let center_y = box_y + box_height / 2.0;

            // Render separator if present (before creating nested container)
            if let Some(separator) = &option.separator {
                let matrix = format!(
                    "matrix({},{},{},{},{},{})",
                    separator_scale[0],
                    0.0,
                    0.0,
                    separator_scale[1],
                    center_x - separator_scale[0] * center_x,
                    center_y - separator_scale[1] * center_y
                );

                if separator == "li" {
                    // Special case for li - render as rect
                    let max_size = size_p.width.max(size_p.height);
                    let rx = 15.0 / size_pn.width * max_size / separator_scale[0];
                    let ry = 15.0 / size_pn.height * max_size / separator_scale[1];
                    writeln!(
                        svg,
                        "<rect transform=\"{}\" height=\"{}\" width=\"{}\" x=\"{}\" y=\"{}\" rx=\"{}\" ry=\"{}\" fill=\"#fff\"></rect>",
                        matrix, box_height, box_width, box_x, box_y, rx, ry
                    ).unwrap();
                } else if separator == "cartouche" {
                    let container_id = GlyphRegistry::container_glyph_id(separator, option.ratio);
                    self.used_glyphs.insert(container_id.clone());
                    writeln!(
                        svg,
                        "<use xlink:href=\"#{}\" transform=\"{}\" height=\"{}\" width=\"{}\" x=\"{}\" y=\"{}\"></use>",
                        container_id, matrix, box_height, box_width, box_x, box_y
                    ).unwrap();
                } else {
                    let container_id = GlyphRegistry::container_glyph_id(separator, option.ratio);
                    self.used_glyphs.insert(container_id.clone());
                    writeln!(
                        svg,
                        "<use xlink:href=\"#{}\" transform=\"{}\" height=\"{}\" width=\"{}\" x=\"{}\" y=\"{}\"></use>",
                        container_id, matrix, box_height, box_width, box_x, box_y
                    ).unwrap();
                }
            }

            // Create nested SVG container
            let viewbox_x = separator_scale[2] - (100.0 * container_scale - 100.0) / 2.0;
            let viewbox_y = (if option.layout_type == LayoutType::Punctuation { 20.0 } else { separator_scale[3] }) - (100.0 * container_scale - 100.0) / 2.0;
            let viewbox_width = 100.0 * container_scale;
            let viewbox_height = 100.0 * container_scale;
            
            writeln!(
                svg,
                r#"<svg viewBox="{} {} {} {}" preserveAspectRatio="none" height="{}" width="{}" x="{}" y="{}" style="overflow: visible;">"#,
                viewbox_x, viewbox_y, viewbox_width, viewbox_height,
                box_height, box_width, box_x, box_y
            ).unwrap();
        }

        // Collect containers and render in correct order
        // 1. Separator is inserted at beginning of parent (if present)
        // 2. Container is inserted at beginning (punctuation) or appended (regular)
        // Since we're building a string, we need to collect separators and write them first
        let mut containers = Vec::new();
        
        for glyph in &option.state.units {
            match &glyph.unit {
                LayoutUnit::Container { units, size, separator, layout_type } => {
                    let nested_ratio = size.ratio();
                    let nested_option = LayoutOption {
                        layout_type: layout_type.clone(),
                        separator: separator.clone(),
                        state: LayoutState {
                            units: units.clone(),
                            size: *size,
                            forbidden: Vec::new(),
                        },
                        size: *size,
                        ratio: nested_ratio,
                        normed_ratio: if nested_ratio < 1.0 { nested_ratio } else { 1.0 / nested_ratio },
                        surface: size.surface(),
                    };
                    containers.push((nested_option, glyph.position, glyph.size));
                }
                _ => {
                    // Regular glyphs - render directly
                    self.render_glyph(glyph, svg, &option.size, glyph_scale)?;
                }
            }
        }
        
        // Render containers in reverse order
        // In JS: when renderPartOption is called, separator is inserted at beginning,
        // then container is inserted at beginning (punctuation) or appended (regular)
        // Since we iterate forward but insert at beginning, we need to reverse
        for (nested_option, pos, size) in containers.iter().rev() {
            self.render_part_option(
                nested_option,
                svg,
                Some(*pos),
                Some(*size),
                Some(option.size),
            )?;
        }

        // Close nested container if we created one
        if position.is_some() {
            writeln!(svg, r#"</svg>"#).unwrap();
        }

        Ok(())
    }

    /// Render a single glyph
    fn render_glyph(
        &mut self,
        placed: &PlacedUnit,
        svg: &mut String,
        container_size: &Size,
        glyph_scale: f64,
    ) -> Result<(), RenderError> {
        let box_x = placed.position.x * 100.0 / container_size.width;
        let box_y = placed.position.y * 100.0 / container_size.height;
        let box_width = placed.size.width * 100.0 / container_size.width;
        let box_height = placed.size.height * 100.0 / container_size.height;
        
        let center_x = box_x + box_width / 2.0;
        let center_y = box_y + box_height / 2.0;
        
        let matrix = format!(
            "matrix({},{},{},{},{},{})",
            glyph_scale, 0.0, 0.0, glyph_scale,
            center_x - glyph_scale * center_x,
            center_y - glyph_scale * center_y
        );

        match &placed.unit {
            LayoutUnit::WordGlyph { token, .. } => {
                let glyph_id = GlyphRegistry::word_glyph_id(token);
                self.used_glyphs.insert(glyph_id.clone());
                writeln!(
                    svg,
                    "<use xlink:href=\"#{}\" transform=\"{}\" height=\"{}\" width=\"{}\" x=\"{}\" y=\"{}\"></use>",
                    glyph_id, matrix, box_height, box_width, box_x, box_y
                ).unwrap();
            }
            LayoutUnit::SyllableGlyph { token, .. } => {
                let glyph_id = GlyphRegistry::syllable_glyph_id(token);
                self.used_glyphs.insert(glyph_id.clone());
                writeln!(
                    svg,
                    "<use xlink:href=\"#{}\" transform=\"{}\" height=\"{}\" width=\"{}\" x=\"{}\" y=\"{}\"></use>",
                    glyph_id, matrix, box_height, box_width, box_x, box_y
                ).unwrap();
            }
            LayoutUnit::Container { .. } => {
                // Containers are handled in render_part_option, not here
                return Err(RenderError::Rendering("Container units should be handled in render_part_option".to_string()));
            }
            LayoutUnit::Punctuation { tokens, .. } => {
                // Render punctuation
                for token in tokens {
                    let glyph_id = GlyphRegistry::word_glyph_id(token);
                    self.used_glyphs.insert(glyph_id.clone());
                    writeln!(
                        svg,
                        "<use xlink:href=\"#{}\" transform=\"{}\" height=\"{}\" width=\"{}\" x=\"{}\" y=\"{}\"></use>",
                        glyph_id, matrix, box_height, box_width, box_x, box_y
                    ).unwrap();
                }
            }
        }

        Ok(())
    }

    /// Get separator scale
    fn get_separator_scale(&self, option: &LayoutOption, base_scale: f64) -> [f64; 4] {
        let mut scale = [
            base_scale * if option.ratio < 0.667 { 1.2 } else { 0.92 },
            base_scale * if option.ratio < 0.667 { 0.9 } else { 0.92 },
            0.0,
            0.0,
        ];

        if let Some(separator) = &option.separator {
            match separator.as_str() {
                "li" => {
                    scale[0] = base_scale * if option.ratio < 0.667 { 1.2 } else { 0.88 };
                    scale[1] = base_scale * if option.ratio < 0.667 { 0.9 } else { 0.88 };
                }
                "o" => {
                    if (option.ratio - 1.0).abs() < 1e-6 {
                        scale[1] = base_scale * 1.0;
                        scale[3] = -10.0;
                    } else if option.ratio < 0.667 {
                        scale[0] = base_scale * 1.0;
                        scale[1] = base_scale * 0.88;
                        scale[3] = -15.0;
                    } else if option.ratio > 1.5 {
                        scale[1] = base_scale * 1.0;
                        scale[2] = -15.0;
                        scale[3] = -10.0;
                    }
                }
                "e" => {
                    if (option.ratio - 1.0).abs() < 1e-6 {
                        scale[0] = base_scale * 1.0;
                        scale[2] = 10.0;
                    } else if option.ratio > 1.5 {
                        scale[2] = 5.0;
                    }
                }
                "tawa" => {
                    if (option.ratio - 1.0).abs() < 1e-6 {
                        scale[0] = base_scale * 0.9;
                        scale[1] = base_scale * 0.9;
                        scale[2] = 5.0;
                        scale[3] = -10.0;
                    } else if option.ratio < 0.667 {
                        scale[0] = base_scale * 0.9;
                        scale[3] = -10.0;
                    } else if option.ratio > 1.5 {
                        scale[2] = 10.0;
                    }
                }
                "poka" | "sama" | "kepeken" | "tan" | "lon" => {
                    // Similar logic for other prepositions
                    if (option.ratio - 1.0).abs() < 1e-6 {
                        scale[0] = base_scale * 0.9;
                        scale[1] = base_scale * 1.1;
                        scale[3] = if separator == "poka" { -20.0 } else if separator == "sama" { -15.0 } else if separator == "kepeken" { -20.0 } else if separator == "tan" { -20.0 } else { -15.0 };
                    } else if option.ratio < 0.667 {
                        scale[0] = base_scale * 0.9;
                        scale[3] = -10.0;
                    } else if option.ratio > 1.5 {
                        scale[2] = 10.0;
                    }
                }
                _ => {}
            }
        }

        scale
    }

    /// Get container scale
    fn get_container_scale(&self, option: &LayoutOption, base_scale: f64, _is_nested: bool) -> f64 {
        // Use baseScale * 1.1 if there's a separator, otherwise 1.02
        let mut scale = if option.separator.is_some() {
            base_scale * 1.1
        } else {
            1.02
        };

        if let Some(separator) = &option.separator {
            match separator.as_str() {
                "e" | "tawa" => {
                    if (option.ratio - 1.0).abs() < 1e-6 {
                        scale = base_scale * 1.2;
                    }
                }
                "tan" => {
                    if option.ratio > 1.5 {
                        scale = base_scale * 1.2;
                    } else if (option.ratio - 1.0).abs() < 1e-6 {
                        scale = base_scale * 1.4;
                    } else if option.ratio < 0.667 {
                        scale = base_scale * 1.2;
                    }
                }
                "kepeken" => {
                    if option.ratio > 1.5 || option.ratio < 0.667 {
                        scale = base_scale * 1.2;
                    }
                }
                "lon" => {
                    if (option.ratio - 1.0).abs() < 1e-6 {
                        scale = base_scale * 1.3;
                    }
                }
                _ => {}
            }
        }

        scale
    }

    /// Render to PNG (using resvg)
    fn render_png(&mut self, layout: &Layout) -> Result<Vec<u8>, RenderError> {
        let svg_bytes = self.render_svg(layout)?;
        let svg_str = String::from_utf8(svg_bytes)
            .map_err(|e| RenderError::Rendering(format!("Invalid SVG: {}", e)))?;
        
        // Use resvg to convert SVG to PNG
        let opt = usvg::Options::default();
        let rtree = usvg::Tree::from_str(&svg_str, &opt)
            .map_err(|e| RenderError::Rendering(format!("Failed to parse SVG: {}", e)))?;
        
        let pixmap_size = rtree.size().to_int_size();
        let mut pixmap = tiny_skia::Pixmap::new(pixmap_size.width(), pixmap_size.height())
            .ok_or_else(|| RenderError::Rendering("Failed to create pixmap".to_string()))?;
        
        resvg::render(&rtree, tiny_skia::Transform::default(), &mut pixmap.as_mut());
        
        // Convert to PNG bytes
        pixmap.encode_png()
            .map_err(|e| RenderError::Rendering(format!("Failed to encode PNG: {}", e)))
    }

    /// Render to HTML with embedded SVG
    fn render_html(&mut self, layout: &Layout) -> Result<Vec<u8>, RenderError> {
        let svg_bytes = self.render_svg(layout)?;
        let svg_str = String::from_utf8(svg_bytes)
            .map_err(|e| RenderError::Rendering(format!("Invalid SVG: {}", e)))?;
        
        let html = format!(
            r#"<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Sitelen Sitelen</title>
    <style>
        body {{
            margin: 0;
            padding: 20px;
            background: white;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }}
        svg {{
            max-width: 100%;
            height: auto;
        }}
    </style>
</head>
<body>
{}
</body>
</html>"#,
            svg_str
        );
        
        Ok(html.into_bytes())
    }
}

