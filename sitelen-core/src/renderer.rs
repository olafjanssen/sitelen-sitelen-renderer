/// SVG renderer for Sitelen Sitelen

use crate::config::{OutputFormat, RenderConfig};
use crate::glyphs::{GlyphRegistry, GlyphError};
use crate::types::*;
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
}

impl Renderer {
    pub fn new(config: RenderConfig) -> Self {
        Self { config }
    }

    /// Render a layout to SVG bytes
    pub fn render(&self, layout: &Layout, format: OutputFormat) -> Result<Vec<u8>, RenderError> {
        match format {
            OutputFormat::Svg => self.render_svg(layout),
            OutputFormat::Png => self.render_png(layout),
            OutputFormat::Html => self.render_html(layout),
        }
    }

    /// Render to SVG
    fn render_svg(&self, layout: &Layout) -> Result<Vec<u8>, RenderError> {
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
                r#"<svg width="{}" height="{}" viewBox="0 0 100 100" y="{}" preserveAspectRatio="none"{}>"#,
                inner_width,
                inner_height,
                y_pos,
                if self.config.shadow { r#" filter="url(#shadow)""# } else { "" }
            ).unwrap();
            
            writeln!(svg, r#"<g style="overflow:visible">"#).unwrap();
            
            self.render_part_option(option, &mut svg, None, None, None)?;
            
            writeln!(svg, r#"</g>"#).unwrap();
            writeln!(svg, r#"</svg>"#).unwrap();
            
            y_pos += inner_height;
        }

        writeln!(svg, r#"</svg>"#).unwrap();

        Ok(svg.into_bytes())
    }

    /// Render part option recursively
    fn render_part_option(
        &self,
        option: &LayoutOption,
        svg: &mut String,
        position: Option<Position>,
        size_parent: Option<Size>,
        size_parent_normed: Option<Size>,
    ) -> Result<(), RenderError> {
        let glyph_scale = self.config.scale;
        let separator_scale = self.get_separator_scale(option, glyph_scale);
        let container_scale = self.get_container_scale(option, glyph_scale);

        // Render separator if present
        if let Some(separator) = &option.separator {
            if let (Some(pos), Some(size_p), Some(size_pn)) = (position, size_parent, size_parent_normed) {
                let box_x = pos.x * 100.0 / size_pn.width;
                let box_y = pos.y * 100.0 / size_pn.height;
                let box_width = size_p.width * 100.0 / size_pn.width;
                let box_height = size_p.height * 100.0 / size_pn.height;
                
                let center_x = box_x + box_width / 2.0;
                let center_y = box_y + box_height / 2.0;
                
                let matrix = format!(
                    "matrix({},{},{},{},{},{})",
                    separator_scale[0],
                    separator_scale[1],
                    separator_scale[2],
                    separator_scale[3],
                    center_x - separator_scale[0] * center_x + separator_scale[2],
                    center_y - separator_scale[1] * center_y + separator_scale[3]
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
                    writeln!(
                        svg,
                        "<use href=\"#{}\" transform=\"{}\" height=\"{}\" width=\"{}\" x=\"{}\" y=\"{}\"></use>",
                        container_id, matrix, box_height, box_width, box_x, box_y
                    ).unwrap();
                } else {
                    let container_id = GlyphRegistry::container_glyph_id(separator, option.ratio);
                    writeln!(
                        svg,
                        "<use href=\"#{}\" transform=\"{}\" height=\"{}\" width=\"{}\" x=\"{}\" y=\"{}\"></use>",
                        container_id, matrix, box_height, box_width, box_x, box_y
                    ).unwrap();
                }
            }
        }

        // Render container
        if let (Some(pos), Some(size_p), Some(size_pn)) = (position, size_parent, size_parent_normed) {
            let box_x = pos.x * 100.0 / size_pn.width;
            let box_y = pos.y * 100.0 / size_pn.height;
            let box_width = size_p.width * 100.0 / size_pn.width;
            let box_height = size_p.height * 100.0 / size_pn.height;
            
            writeln!(
                svg,
                r#"<svg viewBox="{} {} {} {}" preserveAspectRatio="none" height="{}" width="{}" x="{}" y="{}">"#,
                separator_scale[2] - (100.0 * container_scale - 100.0) / 2.0,
                (if option.layout_type == LayoutType::Punctuation { 20.0 } else { separator_scale[3] }) - (100.0 * container_scale - 100.0) / 2.0,
                100.0 * container_scale,
                100.0 * container_scale,
                box_height,
                box_width,
                box_x,
                box_y
            ).unwrap();
            
            writeln!(svg, r#"<g style="overflow:visible">"#).unwrap();
            
            // Render units
            for glyph in &option.state.units {
                match &glyph.unit {
                    LayoutUnit::Container { units, size } => {
                        // Recursively render nested container
                        self.render_part_option(
                            &LayoutOption {
                                layout_type: LayoutType::Container,
                                separator: None,
                                state: LayoutState {
                                    units: units.clone(),
                                    size: *size,
                                    forbidden: Vec::new(),
                                },
                                size: *size,
                                ratio: size.ratio(),
                                normed_ratio: if size.ratio() < 1.0 { size.ratio() } else { 1.0 / size.ratio() },
                                surface: size.surface(),
                            },
                            svg,
                            Some(glyph.position),
                            Some(glyph.size),
                            Some(option.size),
                        )?;
                    }
                    _ => {
                        self.render_glyph(glyph, svg, &option.size, glyph_scale)?;
                    }
                }
            }
            
            writeln!(svg, r#"</g>"#).unwrap();
            writeln!(svg, r#"</svg>"#).unwrap();
        } else {
            // Render units directly
            for glyph in &option.state.units {
                self.render_glyph(glyph, svg, &option.size, glyph_scale)?;
            }
        }

        Ok(())
    }

    /// Render a single glyph
    fn render_glyph(
        &self,
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
                writeln!(
                    svg,
                    "<use href=\"#{}\" transform=\"{}\" height=\"{}\" width=\"{}\" x=\"{}\" y=\"{}\"></use>",
                    glyph_id, matrix, box_height, box_width, box_x, box_y
                ).unwrap();
            }
            LayoutUnit::SyllableGlyph { token, .. } => {
                let glyph_id = GlyphRegistry::syllable_glyph_id(token);
                writeln!(
                    svg,
                    "<use href=\"#{}\" transform=\"{}\" height=\"{}\" width=\"{}\" x=\"{}\" y=\"{}\"></use>",
                    glyph_id, matrix, box_height, box_width, box_x, box_y
                ).unwrap();
            }
            LayoutUnit::Container { units, size } => {
                // Recursively render container
                for unit in units {
                    self.render_glyph(unit, svg, size, glyph_scale)?;
                }
            }
            LayoutUnit::Punctuation { tokens, .. } => {
                // Render punctuation
                for token in tokens {
                    let glyph_id = GlyphRegistry::word_glyph_id(token);
                    writeln!(
                        svg,
                        "<use href=\"#{}\" transform=\"{}\" height=\"{}\" width=\"{}\" x=\"{}\" y=\"{}\"></use>",
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
    fn get_container_scale(&self, option: &LayoutOption, base_scale: f64) -> f64 {
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
    fn render_png(&self, layout: &Layout) -> Result<Vec<u8>, RenderError> {
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
    fn render_html(&self, layout: &Layout) -> Result<Vec<u8>, RenderError> {
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

