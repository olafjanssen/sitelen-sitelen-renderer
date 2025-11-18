/// CLI application for Sitelen Sitelen renderer

use clap::{Parser, ValueEnum};
use sitelen_core::{OutputFormat, Pipeline, RenderConfig};
use std::fs;
use std::path::PathBuf;

#[derive(Parser)]
#[command(name = "sitelen")]
#[command(about = "Render Toki Pona text as Sitelen Sitelen", long_about = None)]
struct Cli {
    /// Input text or file path
    #[arg(short, long)]
    input: Option<String>,

    /// Output file path
    #[arg(short, long)]
    output: Option<PathBuf>,

    /// Output format
    #[arg(short, long, value_enum, default_value = "svg")]
    format: Format,

    /// Optimal aspect ratio (height/width)
    #[arg(long, default_value_t = 0.8)]
    ratio: f64,

    /// Stroke width
    #[arg(long, default_value_t = 2.0)]
    stroke_width: f64,

    /// Enable shadow effects
    #[arg(long)]
    shadow: bool,

    /// Input text directly (alternative to --input)
    text: Option<String>,
}

#[derive(Clone, ValueEnum)]
enum Format {
    Svg,
    Png,
    Html,
}

impl From<Format> for OutputFormat {
    fn from(f: Format) -> Self {
        match f {
            Format::Svg => OutputFormat::Svg,
            Format::Png => OutputFormat::Png,
            Format::Html => OutputFormat::Html,
        }
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();

    // Get input text
    let text = if let Some(input) = &cli.input {
        if PathBuf::from(input).exists() {
            fs::read_to_string(input)?
        } else {
            input.clone()
        }
    } else if let Some(text) = &cli.text {
        text.clone()
    } else {
        eprintln!("Error: No input provided. Use --input <file> or provide text as argument.");
        std::process::exit(1);
    };

    // Create configuration
    let mut config = RenderConfig::default();
    config.optimal_ratio = cli.ratio;
    config.stroke_width = cli.stroke_width;
    config.shadow = cli.shadow;

    // Create pipeline
    let pipeline = Pipeline::with_config(config)?;

    // Render
    let format: OutputFormat = cli.format.clone().into();
    let output_bytes = pipeline.render_text(&text, format)?;

    // Write output
    let output_path = cli.output.unwrap_or_else(|| {
        let ext = match cli.format {
            Format::Svg => "svg",
            Format::Png => "png",
            Format::Html => "html",
        };
        PathBuf::from(format!("output.{}", ext))
    });

    fs::write(&output_path, output_bytes)?;
    println!("Rendered to: {}", output_path.display());

    Ok(())
}

