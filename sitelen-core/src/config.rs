/// Configuration for rendering

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderConfig {
    /// Base scale for glyphs
    pub scale: f64,
    /// Scale skew to allow glyphs to stick out
    pub scale_skew: f64,
    /// Optimal aspect ratio
    pub optimal_ratio: f64,
    /// Minimum allowed ratio
    pub min_ratio: f64,
    /// Maximum allowed ratio
    pub max_ratio: f64,
    /// Stroke width
    pub stroke_width: f64,
    /// Whether to include shadow effects
    pub shadow: bool,
    /// Whether output should be exportable (include glyph definitions)
    pub exportable: bool,
    /// Whether to ignore height constraints
    pub ignore_height: bool,
    /// Whether to use random layout selection
    pub random: bool,
}

impl Default for RenderConfig {
    fn default() -> Self {
        Self {
            scale: 1.2,
            scale_skew: 1.3,
            optimal_ratio: 0.75,
            min_ratio: 0.0,
            max_ratio: 100.0,
            stroke_width: 2.0,
            shadow: false,
            exportable: true,
            ignore_height: false,
            random: false,
        }
    }
}

/// Output format for rendering
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OutputFormat {
    Svg,
    Png,
    Html,
}

