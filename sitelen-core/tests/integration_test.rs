/// Integration tests for Sitelen Sitelen renderer

use sitelen_core::{OutputFormat, Pipeline, RenderConfig};

#[test]
fn test_simple_parse() {
    let parser = sitelen_core::Parser::new();
    let result = parser.parse("mi pona.").unwrap();
    assert_eq!(result.len(), 1);
    assert!(!result[0].parts.is_empty());
}

#[test]
fn test_parse_with_separator() {
    let parser = sitelen_core::Parser::new();
    let result = parser.parse("mi li pona.").unwrap();
    assert_eq!(result.len(), 1);
}

#[test]
fn test_layout_simple() {
    let parser = sitelen_core::Parser::new();
    let sentences = parser.parse("mi pona.").unwrap();
    let layout_engine = sitelen_core::LayoutEngine::new();
    
    for sentence in sentences {
        let options = layout_engine.layout_compound(&sentence);
        assert!(!options.is_empty());
    }
}

#[test]
fn test_render_svg() {
    let config = RenderConfig::default();
    let pipeline = Pipeline::with_config(config).unwrap();
    
    let result = pipeline.render_text("mi pona.", OutputFormat::Svg);
    assert!(result.is_ok());
    let svg_bytes = result.unwrap();
    let svg_str = String::from_utf8(svg_bytes).unwrap();
    assert!(svg_str.contains("<svg"));
}

#[test]
fn test_render_html() {
    let config = RenderConfig::default();
    let pipeline = Pipeline::with_config(config).unwrap();
    
    let result = pipeline.render_text("mi pona.", OutputFormat::Html);
    assert!(result.is_ok());
    let html_bytes = result.unwrap();
    let html_str = String::from_utf8(html_bytes).unwrap();
    assert!(html_str.contains("<!DOCTYPE html>"));
}

